<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import { writable } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let { data }: { data: PageServerData } = $props();
	
	// State for delete account confirmation modal - using $state for reactivity
	let showDeleteConfirmation = $state(false);
	
	// Toggle delete confirmation modal
	function toggleDeleteConfirmation() {
		showDeleteConfirmation = !showDeleteConfirmation;
	}
	
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
		}
	});
	
	onDestroy(() => {
		if (browser && animationId) {
			cancelAnimationFrame(animationId);
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

<div class="container mx-auto px-4 py-8" onmousemove={handleMouseMove} role="application">
	<div class="max-w-4xl mx-auto">
		<div class="bg-black border border-white p-8 shadow-xl" style="transform: translate({$position.x}px, {$position.y}px);">
			<h1 class="text-3xl font-extrabold text-white mb-6">Welcome, {data.user.username}!</h1>
			
			<div class="grid md:grid-cols-2 gap-6 mb-8">
				<div class="bg-black border border-white p-6">
					<h2 class="text-xl font-bold mb-4">Your Organizations</h2>
					<p class="text-gray-300 mb-4">Manage your teams and projects.</p>
					<a 
						href="/dashboard/organizations" 
						class="inline-block border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
					>
						View Organizations
					</a>
				</div>
				
				<div class="bg-black border border-white p-6">
					<h2 class="text-xl font-bold mb-4">Account Settings</h2>
					<p class="text-gray-300 mb-4">View and update your profile and settings.</p>
					<a 
						href="/dashboard/profile" 
						class="inline-block border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200 mr-2"
					>
						Profile
					</a>
					<a 
						href="/dashboard/settings" 
						class="inline-block border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
					>
						Settings
					</a>
				</div>
			</div>
			
			<div class="border-t border-white pt-6">
				<h3 class="text-lg font-semibold mb-4">Account Management</h3>
				<button
					onclick={toggleDeleteConfirmation}
					class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
				>
					Delete Account
				</button>
			</div>
		</div>
	</div>
</div>
	
	<!-- Delete Account Confirmation Modal -->
	{#if showDeleteConfirmation}
		<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
			<div class="bg-black p-8 shadow-xl border-2 border-white max-w-md w-full">
				<h2 class="text-xl font-bold text-white mb-4">Delete Account</h2>
				<p class="text-white mb-6">
					Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
				</p>
				<div class="flex space-x-4">
					<button 
						onclick={toggleDeleteConfirmation}
						class="flex-1 px-4 py-2 bg-black text-white border-2 border-white hover:bg-white hover:text-black transition-colors duration-200"
					>
						Cancel
					</button>
					<form method="post" action="?/deleteAccount" use:enhance class="flex-1">
						<button 
							type="submit"
							class="w-full px-4 py-2 bg-black text-white border-2 border-white hover:bg-white hover:text-black transition-colors duration-200"
						>
							Delete Permanently
						</button>
					</form>
				</div>
			</div>
		</div>
{/if}
