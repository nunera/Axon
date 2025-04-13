<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
	
	// State for delete account confirmation modal - using $state for reactivity
	let showDeleteConfirmation = $state(false);
	
	// Toggle delete confirmation modal
	function toggleDeleteConfirmation() {
		showDeleteConfirmation = !showDeleteConfirmation;
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8" style="background: #000000;">
	<div class="w-full max-w-lg rounded-xl p-8 text-center shadow-xl border border-white" style="background: #000000;">
		<h1 class="mb-4 text-3xl font-extrabold text-white">Welcome, {data.user.username}!</h1>
		<p class="mb-6 text-lg text-white">Your user ID is: <code class="rounded border border-white px-2 py-1 text-sm font-mono text-white">{data.user.id}</code></p>
		
		<div class="flex flex-col space-y-4">
			<form method="post" action="?/logout" use:enhance>
				<button
					type="submit"
					class="w-full justify-center rounded-md border-2 border-white bg-black px-6 py-2 text-sm font-medium text-white hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-colors duration-200"
				>
					Sign out
				</button>
			</form>
			
			<button
				onclick={toggleDeleteConfirmation}
				class="w-full justify-center rounded-md border-2 border-white bg-black px-6 py-2 text-sm font-medium text-white hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-colors duration-200"
			>
				Delete Account
			</button>
		</div>
	</div>
	
	<!-- Delete Account Confirmation Modal -->
	{#if showDeleteConfirmation}
		<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
			<div class="bg-black p-8 rounded-lg shadow-xl border-2 border-white max-w-md w-full">
				<h2 class="text-xl font-bold text-white mb-4">Delete Account</h2>
				<p class="text-white mb-6">
					Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
				</p>
				<div class="flex space-x-4">
					<button 
						onclick={toggleDeleteConfirmation}
						class="flex-1 px-4 py-2 bg-black text-white rounded border-2 border-white hover:bg-white hover:text-black transition-colors duration-200"
					>
						Cancel
					</button>
					<form method="post" action="?/deleteAccount" use:enhance class="flex-1">
						<button 
							type="submit"
							class="w-full px-4 py-2 bg-black text-white rounded border-2 border-white hover:bg-white hover:text-black transition-colors duration-200"
						>
							Delete Permanently
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>
