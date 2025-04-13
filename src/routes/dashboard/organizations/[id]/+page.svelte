<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
	
	// State for member invitation modal
	let showInviteModal = $state(false);
	let inviteUsername = $state('');
	
	// State for leave organization confirmation modal
	let showLeaveConfirmation = $state(false);
	
	// Toggle modals
	function toggleInviteModal() {
		showInviteModal = !showInviteModal;
		if (showInviteModal) {
			inviteUsername = '';
		}
	}
	
	function toggleLeaveConfirmation() {
		showLeaveConfirmation = !showLeaveConfirmation;
	}
	
	// Format date
	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
			<div>
				<h1 class="text-3xl font-bold mb-2">{data.organization.name}</h1>
				<p class="text-gray-400">Created {formatDate(data.organization.createdAt)}</p>
			</div>
			
			<div class="mt-4 md:mt-0 flex space-x-3">
				{#if data.userRole === 'admin'}
					<button
						onclick={toggleInviteModal}
						class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
					>
						Invite Member
					</button>
				{/if}
				
				{#if data.organization.createdById !== data.userId}
					<button
						onclick={toggleLeaveConfirmation}
						class="border-2 border-red-500 bg-black px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200"
					>
						Leave Organization
					</button>
				{/if}
			</div>
		</div>
		
		<!-- Organization Details -->
		<div class="bg-black border border-white p-6 shadow-xl mb-8">
			<h2 class="text-xl font-semibold mb-4">About</h2>
			{#if data.organization.description}
				<p>{data.organization.description}</p>
			{:else}
				<p class="italic text-gray-500">No description provided</p>
			{/if}
		</div>
		
		<!-- Members List -->
		<div class="bg-black border border-white p-6 shadow-xl">
			<h2 class="text-xl font-semibold mb-4">Members ({data.members.length})</h2>
			
			<div class="divide-y divide-white/20">
				{#each data.members as member}
					<div class="py-4 flex justify-between items-center">
						<div>
							<span class="font-medium">{member.username}</span>
							{#if member.userId === data.organization.createdById}
								<span class="ml-2 text-xs bg-white/20 text-white px-2 py-0.5">Owner</span>
							{/if}
							<span class="ml-2 text-xs bg-white/10 text-white px-2 py-0.5 capitalize">
								{member.role}
							</span>
						</div>
						
						{#if data.userRole === 'admin' && member.userId !== data.userId && member.userId !== data.organization.createdById}
							<form method="post" action="?/removeMember" use:enhance>
								<input type="hidden" name="memberId" value={member.userId} />
								<button
									type="submit"
									class="text-sm text-red-500 hover:text-red-400"
								>
									Remove
								</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- Invite Member Modal -->
{#if showInviteModal}
	<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
		<div class="bg-black p-8 shadow-xl border-2 border-white max-w-md w-full">
			<h2 class="text-xl font-bold text-white mb-4">Invite Member</h2>
			
			<form method="post" action="?/inviteMember" use:enhance>
				<div class="mb-4">
					<label for="username" class="block text-sm font-medium text-white mb-1">Username</label>
					<input
						id="username"
						name="username"
						type="text"
						bind:value={inviteUsername}
						required
						class="w-full border border-white bg-black px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
						placeholder="Username of user to invite"
					/>
				</div>
				
				<!-- Error handling removed as 'data.error' does not exist -->
				
				<div class="flex space-x-4 mt-6">
					<button 
						type="button"
						onclick={toggleInviteModal}
						class="flex-1 px-4 py-2 bg-black text-white border-2 border-white hover:bg-white/10 transition-colors duration-200"
					>
						Cancel
					</button>
					<button 
						type="submit"
						class="flex-1 px-4 py-2 bg-white text-black border-2 border-white hover:bg-white/90 transition-colors duration-200"
					>
						Invite
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Leave Organization Confirmation Modal -->
{#if showLeaveConfirmation}
	<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
		<div class="bg-black p-8 shadow-xl border-2 border-white max-w-md w-full">
			<h2 class="text-xl font-bold text-white mb-4">Leave Organization</h2>
			<p class="text-white mb-6">
				Are you sure you want to leave this organization? You will lose access to all its resources.
			</p>
			<div class="flex space-x-4">
				<button 
					onclick={toggleLeaveConfirmation}
					class="flex-1 px-4 py-2 bg-black text-white border-2 border-white hover:bg-white/10 transition-colors duration-200"
				>
					Cancel
				</button>
				<form method="post" action="?/leaveOrganization" use:enhance class="flex-1">
					<button 
						type="submit"
						class="w-full px-4 py-2 bg-red-500 text-white border-2 border-red-500 hover:bg-red-600 transition-colors duration-200"
					>
						Leave
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
