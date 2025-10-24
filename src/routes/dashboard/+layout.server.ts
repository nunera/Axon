import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Redirect unauthenticated users to the login page
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Return the user data to be available in layout data
	return {
		user: locals.user
	};
};
