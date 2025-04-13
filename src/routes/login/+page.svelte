<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8 rounded-xl bg-gray-800 p-8 shadow-xl border border-gray-700">
		<div>
			<h1 class="text-center text-3xl font-extrabold text-white">Login to your account</h1>
		</div>
		{#if form?.message}
			<p class="rounded-md bg-red-900 p-4 text-sm font-medium text-red-200">{form.message}</p>
		{/if}
		<form method="post" action="?/login" use:enhance class="mt-8 space-y-6">
			<div class="space-y-4 rounded-md shadow-sm">
				<div>
					<label for="username" class="sr-only">Username</label>
					<input
						id="username"
						name="username"
						type="text"
						autocomplete="username"
						required
						class="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-indigo-400 focus:outline-none focus:ring-indigo-500 sm:text-sm"
						placeholder="Username"
					/>
				</div>
				<div>
					<label for="password" class="sr-only">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						class="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-indigo-400 focus:outline-none focus:ring-indigo-500 sm:text-sm"
						placeholder="Password"
					/>
				</div>
			</div>

			<div>
				<button
					type="submit"
					class="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				>
					Sign in
				</button>
			</div>
		</form>
		<p class="mt-6 text-center text-sm text-gray-300">
			Don't have an account?
			<a href="/register" class="font-medium text-indigo-400 hover:text-indigo-300">Register here</a>
		</p>
	</div>
</div>
