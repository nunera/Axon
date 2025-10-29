import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

const PASSWORD_MIN_LENGTH = 8;

async function getCredentialAccount(userId: string) {
	const credentialAccount = await db
		.select({
			id: schema.account.id,
			password: schema.account.password
		})
		.from(schema.account)
		.where(and(eq(schema.account.userId, userId), eq(schema.account.providerId, 'credential')))
		.limit(1);

	return credentialAccount[0] ?? null;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const credentialAccount = await getCredentialAccount(locals.user.id as string);

	return {
		hasPassword: Boolean(credentialAccount?.password)
	};
};

function validatePassword(password: string): string | null {
	if (!password || password.length < PASSWORD_MIN_LENGTH) {
		return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
	}
	return null;
}

export const actions: Actions = {
	changePassword: async (event) => {
		const user = event.locals.user;
		if (!user) {
			return fail(401, { message: 'You must be signed in to update your password.' });
		}

		const formData = await event.request.formData();
		const newPasswordRaw = formData.get('newPassword');
		const confirmPasswordRaw = formData.get('confirmPassword');

		if (typeof newPasswordRaw !== 'string' || !newPasswordRaw.trim()) {
			return fail(400, { message: 'New password is required.' });
		}

		if (typeof confirmPasswordRaw !== 'string' || !confirmPasswordRaw.trim()) {
			return fail(400, { message: 'Confirm password is required.' });
		}

		const newPassword = newPasswordRaw.trim();
		const confirmPassword = confirmPasswordRaw.trim();

		const passwordError = validatePassword(newPassword);
		if (passwordError) {
			return fail(400, { message: passwordError });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { message: 'New password and confirmation do not match.' });
		}

		const credentialAccount = await getCredentialAccount(user.id as string);
		const hasPassword = Boolean(credentialAccount?.password);

		let endpoint = '/api/auth/set-password';
		let body: Record<string, unknown> = { newPassword };

		if (hasPassword) {
			const currentPasswordRaw = formData.get('currentPassword');
			if (typeof currentPasswordRaw !== 'string' || !currentPasswordRaw.trim()) {
				return fail(400, { message: 'Current password is required.' });
			}
			const currentPassword = currentPasswordRaw.trim();
			endpoint = '/api/auth/change-password';
			body = { currentPassword, newPassword, revokeOtherSessions: true };
		}

		try {
			const response = await event.fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				let message = 'Unable to update password.';
				try {
					const data = await response.json();
					message = (data?.message as string) ?? message;
				} catch (error) {
					console.error('Failed to parse password change response', error);
				}
				return fail(response.status, { message });
			}

			return { success: true };
		} catch (error) {
			console.error('Failed to update password', error);
			return fail(500, { message: 'Unexpected error updating password.' });
		}
	}
};
