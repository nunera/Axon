<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { form }: { form: ActionData } = $props();

	// Create a writable store for smooth movement
	const position = writable({ x: 0, y: 0 });

	// Spring physics parameters
	const stiffness = 0.1;
	const damping = 0.6;

	// Target and current positions
	let target = { x: 0, y: 0 };
	let current = { x: 0, y: 0 };
	let velocity = { x: 0, y: 0 };

	// Animation frame handler
	let animationId: number;

	function animate() {
		// Calculate spring physics
		const dx = target.x - current.x;
		const dy = target.y - current.y;

		// Apply spring force
		velocity.x += dx * stiffness;
		velocity.y += dy * stiffness;

		// Apply damping
		velocity.x *= damping;
		velocity.y *= damping;

		// Update position
		current.x += velocity.x;
		current.y += velocity.y;

		// Update store
		position.set(current);

		// Continue animation
		animationId = requestAnimationFrame(animate);
	}

	// Only run animation in browser environment
	onMount(() => {
		if (browser) {
			animationId = requestAnimationFrame(animate);

			// Cleanup on component unmount
			return () => {
				cancelAnimationFrame(animationId);
			};
		}
	});

	function handleMouseMove(event: MouseEvent) {
		// Calculate mouse position relative to center of viewport
		const mouseX = event.clientX - window.innerWidth / 2;
		const mouseY = event.clientY - window.innerHeight / 2;

		// Update the target position (which our spring animation will follow)
		target.x = mouseX * 0.02;
		target.y = mouseY * 0.02;
	}
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
	style="background: #000000;"
	onmousemove={handleMouseMove}
	role="application"
>
	<div
		class="w-full max-w-md space-y-8 border border-white p-8 shadow-xl"
		style="background: #000000; transform: translate({$position.x}px, {$position.y}px);"
	>
		<div>
			<h1 class="text-center text-3xl font-extrabold text-white">Login to your account</h1>
		</div>
		{#if form?.message}
			<p class="bg-red-600 p-4 text-sm font-medium text-white">{form.message}</p>
		{/if}
		<form method="post" action="?/login" use:enhance class="mt-8 space-y-6">
			<div class="space-y-4 shadow-sm">
				<div>
					<label for="username" class="sr-only">Username</label>
					<input
						id="username"
						name="username"
						type="text"
						autocomplete="username"
						required
						class="placeholder-opacity-50 relative block w-full appearance-none border border-white bg-black px-3 py-2 text-white placeholder-white focus:z-10 focus:border-white focus:ring-white focus:outline-none sm:text-sm"
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
						class="placeholder-opacity-50 relative block w-full appearance-none border border-white bg-black px-3 py-2 text-white placeholder-white focus:z-10 focus:border-white focus:ring-white focus:outline-none sm:text-sm"
						placeholder="Password"
					/>
				</div>
			</div>

			<div>
				<button
					type="submit"
					class="group relative flex w-full justify-center border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black focus:outline-none"
				>
					Sign in
				</button>
			</div>
		</form>
		<p class="mt-6 text-center text-sm text-white">
			Don't have an account?
			<a href="/register" class="font-medium text-white underline hover:text-white/80"
				>Register here</a
			>
		</p>
	</div>
</div>
