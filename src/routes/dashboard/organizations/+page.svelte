<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import { writable } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let { data }: { data: PageServerData } = $props();
	
	// State for create organization modal
	let showCreateModal = $state(false);
	
	// Form data
	let orgName = $state('');
	let orgDescription = $state('');
	
	// Toggle create modal
	function toggleCreateModal() {
		showCreateModal = !showCreateModal;
		// Reset form data when opening modal
		if (showCreateModal) {
			orgName = '';
			orgDescription = '';
		}
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
	<div class="flex justify-between items-center mb-6" style="transform: translate({$position.x}px, {$position.y}px);">
		<h1 class="text-3xl font-bold">Organizations</h1>
		<button
			onclick={toggleCreateModal}
			class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
		>
			Create Organization
		</button>
	</div>
	
	{#if !data.organizations || data.organizations.length === 0}
		<div class="bg-black border border-white p-8 text-center" style="transform: translate({$position.x * 1.1}px, {$position.y * 1.1}px);">
			<p class="text-xl mb-6">You don't have any organizations yet</p>
			<button
				onclick={toggleCreateModal}
				class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200 inline-block"
			>
				Create Your First Organization
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.organizations as org}
				<div class="bg-black border border-white p-6 flex flex-col" style="transform: translate({$position.x * 0.8}px, {$position.y * 0.8}px);">
					<h3 class="text-xl font-bold mb-2">{org.name}</h3>
					{#if org.description}
						<p class="text-gray-300 mb-4 flex-grow">{org.description}</p>
					{:else}
						<p class="text-gray-500 italic mb-4 flex-grow">No description</p>
					{/if}
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-400">
							{org.role === 'admin' ? 'Admin' : 'Member'}
						</span>
						<a 
							href="/dashboard/organizations/{org.id}" 
							class="border-2 border-white bg-black px-3 py-1 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
						>
							View
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Organization Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
		<div class="bg-black p-8 shadow-xl border-2 border-white max-w-md w-full">
			<h2 class="text-xl font-bold text-white mb-4">Create New Organization</h2>
			
			<form method="post" action="?/createOrganization" use:enhance>
				<div class="mb-4">
					<label for="name" class="block text-sm font-medium text-white mb-1">Organization Name</label>
					<input
						id="name"
						name="name"
						type="text"
						bind:value={orgName}
						required
						class="w-full border border-white bg-black px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
						placeholder="Name your organization"
					/>
				</div>
				
				<div class="mb-4">
					<label for="description" class="block text-sm font-medium text-white mb-1">Description (optional)</label>
					<textarea
						id="description"
						name="description"
						bind:value={orgDescription}
						rows="3"
						class="w-full border border-white bg-black px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
						placeholder="Brief description of your organization"
					></textarea>
				</div>
				
				<div class="flex space-x-4 mt-6">
					<button 
						type="button"
						onclick={toggleCreateModal}
						class="flex-1 px-4 py-2 bg-black text-white border-2 border-white hover:bg-white/10 transition-colors duration-200"
					>
						Cancel
					</button>
					<button 
						type="submit"
						class="flex-1 px-4 py-2 bg-white text-black border-2 border-white hover:bg-white/90 transition-colors duration-200"
					>
						Create
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
