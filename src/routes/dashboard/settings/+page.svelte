<script lang="ts">
	import { enhance } from '$app/forms';

	// Form state
	let showSkillModal = $state(false);
	let skillSearchTerm = $state('');
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mx-auto max-w-4xl">
		<h1 class="mb-8 text-3xl font-bold">Settings</h1>

		<div class="grid grid-cols-1 gap-8">
			<!-- User Settings -->
			<div class="border border-white bg-black p-6">
				<h2 class="mb-4 text-xl font-bold">Account Settings</h2>

				<!-- Change Password -->
				<form method="post" action="?/changePassword" use:enhance class="mb-8">
					<h3 class="mb-3 text-lg font-semibold">Change Password</h3>
					<div class="space-y-4">
						<div>
							<label for="currentPassword" class="mb-1 block text-sm font-medium text-white"
								>Current Password</label
							>
							<input
								id="currentPassword"
								name="currentPassword"
								type="password"
								required
								class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
							/>
						</div>
						<div>
							<label for="newPassword" class="mb-1 block text-sm font-medium text-white"
								>New Password</label
							>
							<input
								id="newPassword"
								name="newPassword"
								type="password"
								required
								class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
							/>
						</div>
						<div>
							<label for="confirmPassword" class="mb-1 block text-sm font-medium text-white"
								>Confirm Password</label
							>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								required
								class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
							/>
						</div>
						<button
							type="submit"
							class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black"
						>
							Update Password
						</button>
					</div>
				</form>

				<!-- Visualization Preferences -->
				<form method="post" action="?/updatePreferences" use:enhance>
					<h3 class="mb-3 text-lg font-semibold">Visualization Preferences</h3>
					<div class="space-y-4">
						<div>
							<label for="skillEdgeDetail" class="mb-1 block text-sm font-medium text-white"
								>Skill Edge Detail Level</label
							>
							<select
								id="skillEdgeDetail"
								name="skillEdgeDetail"
								class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
							>
								<option value="simple">Simple (Show Connections Only)</option>
								<option value="detailed">Detailed (Show Proficiency & Labels)</option>
							</select>
						</div>
						<div class="flex items-center">
							<input
								id="showSkillProficiency"
								name="showSkillProficiency"
								type="checkbox"
								class="h-4 w-4 border-white focus:ring-white"
							/>
							<label for="showSkillProficiency" class="ml-2 text-sm text-white"
								>Show Skill Proficiency Labels</label
							>
						</div>
						<div class="flex items-center">
							<input
								id="highlightMatches"
								name="highlightMatches"
								type="checkbox"
								class="h-4 w-4 border-white focus:ring-white"
							/>
							<label for="highlightMatches" class="ml-2 text-sm text-white"
								>Highlight Skill/Task Matches</label
							>
						</div>
						<button
							type="submit"
							class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black"
						>
							Save Preferences
						</button>
					</div>
				</form>
			</div>

			<!-- Skill Management -->
			<div class="border border-white bg-black p-6">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-bold">Skill Management</h2>
					<button
						onclick={() => (showSkillModal = !showSkillModal)}
						class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black"
					>
						Request Skill Verification
					</button>
				</div>

				<div class="mb-6">
					<h3 class="mb-3 text-lg font-semibold">Skill Verification Status</h3>
					<p class="mb-3 text-sm text-gray-400">
						Verified skills demonstrate expertise and appear more prominently in visualizations.
						Request verification for your skills, and they will be reviewed based on your task
						history and contributions.
					</p>

					<div class="rounded border border-white/30 p-4">
						<div class="mb-4 flex items-center justify-between">
							<div>
								<span class="font-medium">JavaScript</span>
								<span
									class="ml-2 rounded border border-green-500 bg-green-600/30 px-1 py-0.5 text-xs"
									>Verified</span
								>
							</div>
							<span class="text-sm text-gray-400">Verified on April 10, 2025</span>
						</div>
						<div class="mb-4 flex items-center justify-between">
							<div>
								<span class="font-medium">TypeScript</span>
								<span
									class="ml-2 rounded border border-yellow-500 bg-yellow-600/30 px-1 py-0.5 text-xs"
									>Pending</span
								>
							</div>
							<span class="text-sm text-gray-400">Requested on April 12, 2025</span>
						</div>
						<div class="flex items-center justify-between">
							<div>
								<span class="font-medium">React</span>
								<span class="ml-2 rounded border border-gray-500 bg-gray-600/30 px-1 py-0.5 text-xs"
									>Not Verified</span
								>
							</div>
							<button class="text-xs text-white underline hover:text-blue-300"
								>Request Verification</button
							>
						</div>
					</div>
				</div>

				<div>
					<h3 class="mb-3 text-lg font-semibold">Skill Categories</h3>
					<p class="mb-3 text-sm text-gray-400">
						Add custom skill categories to better organize your skills in the visualization.
					</p>

					<form method="post" action="?/addSkillCategory" use:enhance class="space-y-4">
						<div>
							<label for="categoryName" class="mb-1 block text-sm font-medium text-white"
								>New Category Name</label
							>
							<div class="flex">
								<input
									id="categoryName"
									name="categoryName"
									type="text"
									required
									class="flex-1 border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
									placeholder="Enter category name"
								/>
								<button
									type="submit"
									class="ml-2 border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black"
								>
									Add
								</button>
							</div>
						</div>
					</form>

					<div class="mt-4">
						<div class="flex flex-wrap gap-2">
							<span class="rounded border border-purple-500 bg-purple-900/50 px-2 py-1 text-xs"
								>Programming</span
							>
							<span class="rounded border border-purple-500 bg-purple-900/50 px-2 py-1 text-xs"
								>Design</span
							>
							<span class="rounded border border-purple-500 bg-purple-900/50 px-2 py-1 text-xs"
								>Frontend</span
							>
							<span class="rounded border border-purple-500 bg-purple-900/50 px-2 py-1 text-xs"
								>Backend</span
							>
							<span class="rounded border border-purple-500 bg-purple-900/50 px-2 py-1 text-xs"
								>AI/ML</span
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Skill Verification Modal -->
{#if showSkillModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
		<div class="w-full max-w-md border-2 border-white bg-black p-8 shadow-xl">
			<h2 class="mb-4 text-xl font-bold text-white">Request Skill Verification</h2>

			<form method="post" action="?/requestVerification" use:enhance class="space-y-4">
				<div>
					<label for="skillVerification" class="mb-1 block text-sm font-medium text-white"
						>Choose Skill</label
					>
					<select
						id="skillVerification"
						name="skillId"
						class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
					>
						<option value="" disabled selected>Select a skill</option>
						<option value="1">JavaScript</option>
						<option value="2">TypeScript</option>
						<option value="3">React</option>
						<option value="4">Node.js</option>
					</select>
				</div>

				<div>
					<label for="verificationNote" class="mb-1 block text-sm font-medium text-white">
						Verification Note (optional)
					</label>
					<textarea
						id="verificationNote"
						name="verificationNote"
						rows="3"
						class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
						placeholder="Briefly explain your experience with this skill..."
					></textarea>
				</div>

				<div class="mt-6 flex space-x-4">
					<button
						type="button"
						onclick={() => (showSkillModal = false)}
						class="flex-1 border-2 border-white bg-black px-4 py-2 text-white transition-colors duration-200 hover:bg-white/10"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="flex-1 border-2 border-white bg-white px-4 py-2 text-black transition-colors duration-200 hover:bg-white/80"
					>
						Request
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
