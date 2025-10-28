import { fail, redirect } from '@sveltejs/kit';
import type { Redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (!validateUsername(username)) {
			return fail(400, {
				message: 'Invalid username (min 3, max 31 characters, alphanumeric only)'
			});
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password (min 6 characters)' });
		}

		const response = await event.fetch('/api/auth/sign-in/username', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ username, password })
		});

		if (!response.ok) {
			let message = 'Incorrect username or password';
			try {
				const data = await response.json();
				message = data?.message ?? message;
			} catch (jsonError) {
				try {
					const text = await response.text();
					message = text || message;
				} catch (textError) {
					console.error('Failed to read Better Auth sign-in response body', textError);
				}
				console.error('Failed to parse Better Auth sign-in response', jsonError);
			}
			return fail(response.status, { message });
		}

		throw redirect(302, '/dashboard');
	},

	loginWithGoogle: async (event) => {
		const callbackURL = `${event.url.origin}/dashboard`;
		const errorCallbackURL = `${event.url.origin}/login`;

		let response: Response;
		try {
			response = await event.fetch('/api/auth/sign-in/social', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					provider: 'google',
					callbackURL,
					errorCallbackURL,
					disableRedirect: true
				})
			});
		} catch (err) {
			if (err && typeof err === 'object' && 'location' in err && 'status' in err) {
				throw err as Redirect;
			}
			throw err;
		}

		if (!response.ok) {
			if (response.status >= 300 && response.status < 400) {
				const location = response.headers.get('location');
				if (location) {
					throw redirect(302, location);
				}
			}
			let message = 'Unable to redirect to Google';
			try {
				const data = await response.json();
				message = data?.message ?? message;
			} catch (jsonError) {
				try {
					const text = await response.text();
					message = text || message;
				} catch (textError) {
					console.error('Failed to read Better Auth OAuth response body', textError);
				}
				console.error('Failed to parse Better Auth OAuth response', jsonError);
			}
			return fail(response.status ?? 500, { message });
		}

		const data = await response.json();
		if (data?.url) {
			throw redirect(302, data.url as string);
		}
		throw redirect(302, '/login');
	}
};

function validateUsername(username: unknown): username is string {
	return (
		typeof username === 'string' &&
		username.length >= 3 &&
		username.length <= 31 &&
		/^[a-zA-Z0-9_-]+$/.test(username)
	);
}

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6;
}
