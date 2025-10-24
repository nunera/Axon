<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import { writable } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let { data }: { data: PageServerData } = $props();

	// Feedback for invitation actions
	let inviteAlert = $state('');
	let inviteError = $state('');

	// State for create organization modal
	let showCreateModal = $state(false);

	// Form data
	let orgName = $state('');
	let orgDescription = $state('');

	const enhanceAcceptInvite = () => {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			if (result.type === 'success') {
				inviteError = '';
				inviteAlert = 'Invitation accepted. Welcome aboard!';
				await update();
			} else if (result.type === 'failure') {
				inviteAlert = '';
				inviteError =
					typeof result.data?.message === 'string'
						? result.data.message
						: 'Failed to accept invitation';
			}
		};
	};

	const enhanceDeclineInvite = () => {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			if (result.type === 'success') {
				inviteError = '';
				inviteAlert = 'Invitation declined.';
				await update();
			} else if (result.type === 'failure') {
				inviteAlert = '';
				inviteError =
					typeof result.data?.message === 'string'
						? result.data.message
						: 'Failed to decline invitation';
			}
		};
	};

	function formatInviteDate(value: string | Date) {
		return new Date(value).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function toggleCreateModal() {
		showCreateModal = !showCreateModal;
		if (showCreateModal) {
			orgName = '';
			orgDescription = '';
		}
	}

	function closeCreateModal() {
		showCreateModal = false;
		orgName = '';
		orgDescription = '';
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
	<div
		class="mb-6 flex items-center justify-between"
		style="transform: translate({$position.x}px, {$position.y}px);"
	>
		<h1 class="text-3xl font-bold">Organizations</h1>
		<button
			onclick={toggleCreateModal}
			class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black"
		>
			Create Organization
		</button>
	</div>

	{#if !data.organizations || data.organizations.length === 0}
		<div
			class="border border-white bg-black p-8 text-center"
			style="transform: translate({$position.x * 1.1}px, {$position.y * 1.1}px);"
		>
			<p class="mb-6 text-xl">You don't have any organizations yet</p>
			<button
				onclick={toggleCreateModal}
				class="inline-block border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black"
			>
				Create Your First Organization
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each data.organizations as org}
				<div
					class="flex flex-col border border-white bg-black p-6"
					style="transform: translate({$position.x * 0.8}px, {$position.y * 0.8}px);"
				>
					<h3 class="mb-2 text-xl font-bold">{org.name}</h3>
					{#if org.description}
						<p class="mb-4 flex-grow text-gray-300">{org.description}</p>
					{:else}
						<p class="mb-4 flex-grow text-gray-500 italic">No description</p>
					{/if}
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-400">
							{org.role === 'admin' ? 'Admin' : 'Member'}
						</span>
						<a
							href="/dashboard/organizations/{org.id}"
							class="border-2 border-white bg-black px-3 py-1 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black"
						>
							View
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if data.invites && data.invites.length > 0}
		<section
			class="mx-auto mt-8 max-w-3xl border border-white bg-black/60 p-6"
			style="transform: translate({$position.x * 0.6}px, {$position.y * 0.6}px);"
		>
			<h2 class="mb-4 text-xl font-semibold">Pending Invitations</h2>
			{#if inviteAlert}
				<p class="mb-4 border border-green-500 bg-green-900/40 px-3 py-2 text-sm text-green-200">
					{inviteAlert}
				</p>
			{/if}
			{#if inviteError}
				<p class="mb-4 border border-red-500 bg-red-900/40 px-3 py-2 text-sm text-red-200">
					{inviteError}
				</p>
			{/if}
			<ul class="space-y-4">
				{#each data.invites as invite}
					<li
						class="flex flex-col gap-3 border border-white/30 px-4 py-3 md:flex-row md:items-center md:justify-between"
					>
						<div>
							<p class="font-medium">{invite.organizationName}</p>
							<p class="text-sm text-gray-400">
								Invited by @{invite.inviterUsername} on {formatInviteDate(invite.createdAt)}
							</p>
						</div>
						<div class="flex gap-2">
							<form method="post" action="?/acceptInvite" use:enhance={enhanceAcceptInvite}>
								<input type="hidden" name="inviteId" value={invite.id} />
								<button
									type="submit"
									class="border-2 border-green-500 px-3 py-1.5 text-sm text-green-400 transition-colors hover:bg-green-500 hover:text-black"
									>Accept</button
								>
							</form>
							<form method="post" action="?/declineInvite" use:enhance={enhanceDeclineInvite}>
								<input type="hidden" name="inviteId" value={invite.id} />
								<button
									type="submit"
									class="border-2 border-red-500 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500 hover:text-black"
									>Decline</button
								>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<!-- Create Organization Modal -->
{#if showCreateModal}
	<div
		role="button"
		tabindex="0"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeCreateModal();
		}}
		onkeydown={(event) => {
			if (event.key === 'Escape') closeCreateModal();
		}}
	>
		<div
			role="dialog"
			aria-modal="true"
			tabindex="0"
			class="flex max-h-[85vh] w-full max-w-md flex-col border-2 border-white bg-black shadow-xl"
			onclick={(event) => event.stopPropagation()}
			onkeydown={(event) => event.stopPropagation()}
		>
			<form
				method="post"
				action="?/createOrganization"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							await update();
							closeCreateModal();
						}
					};
				}}
				class="flex h-full flex-col overflow-hidden"
			>
				<header class="px-8 pt-8">
					<h2 class="text-xl font-bold text-white">Create New Organization</h2>
				</header>

				<div class="flex-1 space-y-4 overflow-y-auto px-8 pb-4">
					<div>
						<label for="name" class="mb-1 block text-sm font-medium text-white"
							>Organization Name</label
						>
						<input
							id="name"
							name="name"
							type="text"
							bind:value={orgName}
							required
							class="w-full border border-white bg-black px-3 py-2 text-white placeholder-white/50 focus:ring-2 focus:ring-white focus:outline-none"
							placeholder="Name your organization"
						/>
					</div>

					<div>
						<label for="description" class="mb-1 block text-sm font-medium text-white"
							>Description (optional)</label
						>
						<textarea
							id="description"
							name="description"
							bind:value={orgDescription}
							rows="3"
							class="w-full border border-white bg-black px-3 py-2 text-white placeholder-white/50 focus:ring-2 focus:ring-white focus:outline-none"
							placeholder="Brief description of your organization"
						></textarea>
					</div>
				</div>

				<footer class="flex gap-4 border-t border-white/30 px-8 pt-4 pb-8">
					<button
						type="button"
						onclick={closeCreateModal}
						class="flex-1 border-2 border-white bg-black px-4 py-2 text-white transition-colors duration-200 hover:bg-white/10"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="flex-1 border-2 border-white bg-white px-4 py-2 text-black transition-colors duration-200 hover:bg-white/90"
					>
						Create
					</button>
				</footer>
			</form>
		</div>
	</div>
{/if}
