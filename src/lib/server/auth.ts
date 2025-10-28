import type { Handle, RequestEvent } from '@sveltejs/kit';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
import type { SocialProviders } from 'better-auth/social-providers';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { and, eq, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { getEnv } from '$lib/server/env';


const BETTER_AUTH_SECRET = getEnv('BETTER_AUTH_SECRET');
const BETTER_AUTH_BASE_URL = getEnv('BETTER_AUTH_URL', 'http://localhost:5173');
const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = getEnv('GOOGLE_CLIENT_SECRET');

if (!BETTER_AUTH_SECRET) {
	throw new Error('BETTER_AUTH_SECRET is not set');
}

const socialProviders: SocialProviders = {};

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
	const redirectURI = new URL('/api/auth/callback/google', BETTER_AUTH_BASE_URL).toString();
	socialProviders.google = {
		clientId: GOOGLE_CLIENT_ID,
		clientSecret: GOOGLE_CLIENT_SECRET,
		scope: ['openid', 'profile', 'email'],
		redirectURI,
		prompt: 'consent',
		accessType: 'offline'
	};
}

function sanitizeUsernameCandidate(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, '')
		.replace(/-{2,}/g, '-')
		.replace(/_{2,}/g, '_')
		.replace(/^-+/, '')
		.replace(/-+$/, '')
		.slice(0, 31);
}

function randomSuffix(length = 4): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let output = '';
	for (let i = 0; i < length; i += 1) {
		output += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return output;
}

async function generateAvailableUsername(user: { email?: string | null; name?: string | null }): Promise<string> {
	const preferred: string[] = [];
	if (user.email) {
		preferred.push(user.email.split('@')[0] ?? '');
	}
	if (user.name) {
		preferred.push(user.name);
	}
	preferred.push('axon');

	for (const candidate of preferred) {
		const base = sanitizeUsernameCandidate(candidate);
		if (base.length < 3) continue;
		let suffix = 0;
		while (suffix < 100) {
			const suffixPart = suffix === 0 ? '' : `${suffix}`;
			const trimmedBase = base.slice(0, Math.max(3, 31 - suffixPart.length));
			const username = `${trimmedBase}${suffixPart}`;
			const existing = await db
				.select({ id: schema.user.id })
				.from(schema.user)
				.where(eq(schema.user.username, username))
				.limit(1);
			if (existing.length === 0 && username.length >= 3) {
				return username;
			}
			suffix += 1;
		}
	}

	return `axon_${randomSuffix(6)}`;
}

export const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_BASE_URL,
	database: drizzleAdapter(db, {
		provider: 'pg',
		user: schema.user,
		session: schema.session,
		account: schema.account,
		verification: schema.verification
	}),
	emailAndPassword: {
		enabled: true
	},
	session: {
		cookie: {
			name: 'axon-session'
		}
	},
	socialProviders,
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					if (user.username) {
						if (!user.displayUsername) {
							return {
								data: {
									...user,
									displayUsername: user.name ?? user.username
								}
							};
						}
						return;
					}

					const username = await generateAvailableUsername(user);
					return {
						data: {
							...user,
							username,
							displayUsername: user.name ?? user.displayUsername ?? username
						}
					};
				}
			}
		}
	},
	plugins: [
		username({
			field: 'username',
			displayField: 'displayUsername'
		})
	]
});

type AuthState = {
	session: Record<string, unknown> | null;
	user: Record<string, unknown> | null;
};

export const handleBetterAuth: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ auth, event, resolve });
};

export async function validateRequest(event: RequestEvent): Promise<AuthState> {
	try {
		const response = await event.fetch('/api/auth/get-session', {
			headers: { accept: 'application/json' }
		});

		if (response.ok) {
			const data = await response.json();
			return {
				session: data?.session ?? null,
				user: data?.user ?? null
			};
		}

		if (response.status === 401) {
			return { session: null, user: null };
		}

		console.warn('Unexpected Better Auth session response', response.status);
	} catch (error) {
		console.error('Failed to fetch Better Auth session', error);
	}

	return { session: null, user: null };
}

export type BetterAuthSession = Awaited<ReturnType<typeof validateRequest>>['session'];
export type BetterAuthUser = Awaited<ReturnType<typeof validateRequest>>['user'];

export async function deleteUserAccount(userId: string) {
	const createdOrganizations = await db
		.select()
		.from(schema.organization)
		.where(eq(schema.organization.createdById, userId));

	if (createdOrganizations.length > 0) {
		for (const org of createdOrganizations) {
			const members = await db
				.select()
				.from(schema.userOrganization)
				.where(eq(schema.userOrganization.organizationId, org.id));

			const otherAdmin = members.find((m) => m.userId !== userId && m.role === 'admin');

			if (otherAdmin) {
				await db
					.update(schema.organization)
					.set({ createdById: otherAdmin.userId })
					.where(eq(schema.organization.id, org.id));
			} else if (members.length > 1) {
				const firstMember = members.find((m) => m.userId !== userId);
				if (firstMember) {
					await db
						.update(schema.userOrganization)
						.set({ role: 'admin' })
						.where(
							and(
								eq(schema.userOrganization.userId, firstMember.userId),
								eq(schema.userOrganization.organizationId, org.id)
							)
						);

					await db
						.update(schema.organization)
						.set({ createdById: firstMember.userId })
						.where(eq(schema.organization.id, org.id));
				}
			} else {
				await db.delete(schema.task).where(eq(schema.task.organizationId, org.id));

				await db
					.delete(schema.userOrganization)
					.where(eq(schema.userOrganization.organizationId, org.id));

				await db.delete(schema.organization).where(eq(schema.organization.id, org.id));
			}
		}
	}

	await db.delete(schema.userOrganization).where(eq(schema.userOrganization.userId, userId));

	await db
		.delete(schema.organizationInvitation)
		.where(
			or(
				eq(schema.organizationInvitation.inviteeId, userId),
				eq(schema.organizationInvitation.inviterId, userId)
			)
		);

	await db.delete(schema.taskAssignment).where(eq(schema.taskAssignment.userId, userId));

	await db
		.update(schema.task)
		.set({ assignedToId: null })
		.where(eq(schema.task.assignedToId, userId));

	await db.delete(schema.userInterest).where(eq(schema.userInterest.userId, userId));

	await db.delete(schema.userSkill).where(eq(schema.userSkill.userId, userId));

	await db.delete(schema.account).where(eq(schema.account.userId, userId));
	await db.delete(schema.session).where(eq(schema.session.userId, userId));
	await db.delete(schema.verification).where(eq(schema.verification.userId, userId));

	await db.delete(schema.user).where(eq(schema.user.id, userId));
}
