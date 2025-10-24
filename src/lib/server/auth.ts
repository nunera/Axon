import type { RequestEvent } from '@sveltejs/kit';
import { eq, and, or } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(token: string, userId: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: table.Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};
	await db.insert(table.session).values(session);
	return session;
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			user: { id: table.user.id, username: table.user.username },
			session: table.session
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
}

export async function deleteUserAccount(userId: string) {
	// Check if user has created any organizations
	const createdOrganizations = await db
		.select()
		.from(table.organization)
		.where(eq(table.organization.createdById, userId));

	if (createdOrganizations.length > 0) {
		// Process each organization the user created
		for (const org of createdOrganizations) {
			// Get all organization members
			const members = await db
				.select()
				.from(table.userOrganization)
				.where(eq(table.userOrganization.organizationId, org.id));

			// Find another admin to transfer ownership, if any
			const otherAdmin = members.find((m) => m.userId !== userId && m.role === 'admin');

			if (otherAdmin) {
				// Transfer ownership to another admin
				await db
					.update(table.organization)
					.set({ createdById: otherAdmin.userId })
					.where(eq(table.organization.id, org.id));
			} else if (members.length > 1) {
				// No other admin but there are other members - promote the first non-creator member to admin and transfer ownership
				const firstMember = members.find((m) => m.userId !== userId);
				if (firstMember) {
					// Update member role to admin
					await db
						.update(table.userOrganization)
						.set({ role: 'admin' })
						.where(
							and(
								eq(table.userOrganization.userId, firstMember.userId),
								eq(table.userOrganization.organizationId, org.id)
							)
						);

					// Transfer ownership
					await db
						.update(table.organization)
						.set({ createdById: firstMember.userId })
						.where(eq(table.organization.id, org.id));
				}
			} else {
				// This is the only member - delete the organization and its related data

				// Delete all tasks associated with this organization first
				await db.delete(table.task).where(eq(table.task.organizationId, org.id));

				// Delete user memberships
				await db
					.delete(table.userOrganization)
					.where(eq(table.userOrganization.organizationId, org.id));

				// Delete the organization
				await db.delete(table.organization).where(eq(table.organization.id, org.id));
			}
		}
	}

	// Delete all associations with organizations
	await db.delete(table.userOrganization).where(eq(table.userOrganization.userId, userId));

	// Remove any outstanding invitations involving this user
	await db
		.delete(table.organizationInvitation)
		.where(
			or(
				eq(table.organizationInvitation.inviteeId, userId),
				eq(table.organizationInvitation.inviterId, userId)
			)
		);

	// Remove any task assignments for this user
	await db.delete(table.taskAssignment).where(eq(table.taskAssignment.userId, userId));

	// Delete all tasks assigned to this user
	await db
		.update(table.task)
		.set({ assignedToId: null })
		.where(eq(table.task.assignedToId, userId));

	// Delete all tasks created by this user (optional - might want to keep them)
	// await db.delete(table.task).where(eq(table.task.createdById, userId));

	// Delete user interests
	await db.delete(table.userInterest).where(eq(table.userInterest.userId, userId));

	// Delete user skills
	await db.delete(table.userSkill).where(eq(table.userSkill.userId, userId));

	// Delete all user sessions
	await db.delete(table.session).where(eq(table.session.userId, userId));

	// Finally, delete the user
	await db.delete(table.user).where(eq(table.user.id, userId));
}
