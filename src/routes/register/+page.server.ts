import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	register: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email');
		const username = formData.get('username');
		const password = formData.get('password');

		if (!validateEmail(email)) {
			return fail(400, { message: 'Invalid email address' });
		}
		if (!validateUsername(username)) {
			return fail(400, {
				message: 'Invalid username (min 3, max 31 characters, alphanumeric only)'
			});
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password (min 6 characters)' });
		}

		const response = await event.fetch('/api/auth/sign-up/email', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				email,
				password,
				name: username,
				displayUsername: username,
				username
			})
		});

		if (!response.ok) {
			let message = 'Registration failed';
			try {
				const data = await response.json();
				message = data?.message ?? message;
			} catch (jsonError) {
				try {
					const text = await response.text();
					message = text || message;
				} catch (textError) {
					console.error('Failed to read Better Auth sign-up response body', textError);
				}
				console.error('Failed to parse Better Auth sign-up response', jsonError);
			}
			return fail(response.status, { message });
		}

		throw redirect(302, '/dashboard');
	}
};

function validateEmail(email: unknown): email is string {
	return typeof email === 'string' && email.includes('@');
}

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
