import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { handleBetterAuth, validateRequest } from '$lib/server/auth.js';

const loadAuthState: Handle = async ({ event, resolve }) => {
	const { session, user } = await validateRequest(event);

	event.locals.session = session;
	event.locals.user = user;

	return resolve(event);
};

export const handle: Handle = sequence(handleBetterAuth, loadAuthState);
