import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Redirect unauthenticated users to the login page
	if (!event.locals.user) {
		return redirect(302, '/login');
	}
	return { user: event.locals.user };
};

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		// Redirect to login page after logout
		return redirect(302, '/login');
	},
	
	deleteAccount: async (event) => {
		if (!event.locals.session || !event.locals.user) {
			return fail(401);
		}
		
		// Get the user ID
		const userId = event.locals.user.id;
		
		// Delete the user account - this will also delete their sessions
		await auth.deleteUserAccount(userId);
		
		// Delete the session cookie
		auth.deleteSessionTokenCookie(event);
		
		// Redirect to homepage after account deletion
		return redirect(302, '/');
	}
};
