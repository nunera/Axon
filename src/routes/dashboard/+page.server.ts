import { deleteUserAccount } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}
	return { user: event.locals.user };
};

export const actions: Actions = {
	logout: async (event) => {
		const response = await event.fetch('/api/auth/sign-out', { method: 'POST' });

		if (!response.ok) {
			let message = 'Failed to sign out';
			try {
				const data = await response.json();
				message = data?.message ?? message;
			} catch (jsonError) {
				try {
					const text = await response.text();
					message = text || message;
				} catch (textError) {
					console.error('Failed to read Better Auth sign-out response body', textError);
				}
				console.error('Failed to parse Better Auth sign-out response', jsonError);
			}
			return fail(response.status ?? 500, { message });
		}

		throw redirect(302, '/login');
	},

	deleteAccount: async (event) => {
		if (!event.locals.user) {
			return fail(401);
		}

		await deleteUserAccount(event.locals.user.id);

		const response = await event.fetch('/api/auth/sign-out', { method: 'POST' });
		if (!response.ok) {
			let message = 'Failed to clear session';
			try {
				const data = await response.json();
				message = data?.message ?? message;
			} catch (jsonError) {
				try {
					const text = await response.text();
					message = text || message;
				} catch (textError) {
					console.error('Failed to read Better Auth logout response body', textError);
				}
				console.error('Failed to parse Better Auth logout response', jsonError);
			}
			return fail(response.status ?? 500, { message });
		}

		throw redirect(302, '/');
	}
};
