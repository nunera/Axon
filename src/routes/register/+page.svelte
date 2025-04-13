<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8" style="background: #000000;">
	<div class="w-full max-w-md space-y-8 rounded-xl p-8 shadow-xl border border-white" style="background: #000000;">
		<div>
			<h1 class="text-center text-3xl font-extrabold text-white">Create your account</h1>
		</div>
		{#if form?.message}
			<p class="rounded-md p-4 text-sm font-medium text-white bg-red-600">{form.message}</p>
		{/if}
		<form method="post" action="?/register" use:enhance class="mt-8 space-y-6">
			<div class="space-y-4 rounded-md shadow-sm">
				<div>
					<label for="username" class="sr-only">Username</label>
					<input
						id="username"
						name="username"
						type="text"
						autocomplete="username"
						required
						class="relative block w-full appearance-none rounded-none rounded-t-md border border-white bg-black px-3 py-2 text-white placeholder-white placeholder-opacity-50 focus:z-10 focus:border-white focus:outline-none focus:ring-white sm:text-sm"
						placeholder="Username"
					/>
				</div>
				<div>
					<label for="password" class="sr-only">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
						class="relative block w-full appearance-none rounded-none rounded-b-md border border-white bg-black px-3 py-2 text-white placeholder-white placeholder-opacity-50 focus:z-10 focus:border-white focus:outline-none focus:ring-white sm:text-sm"
						placeholder="Password"
					/>
				</div>
			</div>

			<div>
				<button
					type="submit"
					class="group relative flex w-full justify-center rounded-md border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-colors duration-200"
				>
					Register
				</button>
			</div>
		</form>
		<p class="mt-6 text-center text-sm text-white">
			Already have an account?
			<a href="/login" class="font-medium text-white hover:text-white/80 underline">Login here</a>
		</p>
	</div>
</div>
