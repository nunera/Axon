<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	
	let { data } = $props<{ data: PageData }>();
	
	// State for UI
	let showAddSkillModal = $state(false);
	let newSkillName = $state('');
	let newSkillProficiency = $state(3);
	let customSkill = $state(false);
	let selectedSkillId = $state<number | null>(null);
	let skills = $state<Array<{id: number, name: string, category: string | null}>>([]);
	let searchTerm = $state('');
	let filteredSkills = $state<Array<{id: number, name: string, category: string | null}>>([]);
	
	// State for user skills
	let userSkills = $state<Array<{
		id: number, 
		name: string, 
		proficiency: number | null,
		verified: boolean
	}>>([]);
	
	// On mount, initialize data
	onMount(async () => {
		// Initialize skills
		if (data.skills) {
			skills = data.skills;
			filteredSkills = [...skills];
		}
		
		// Initialize user skills
		if (data.userSkills) {
			userSkills = data.userSkills;
		}
		
		// Ensure form data is refreshed after actions
		const { form } = data;
		if (form && form.success) {
			// Reset modal state if the action was successful
			if (showAddSkillModal) {
				showAddSkillModal = false;
			}
		}
	});
	
	// Create an enhance function to use in the forms
	function enhanceForm({ formElement }: { formElement: HTMLFormElement }) {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			if (result.type === 'success') {
				// Update the local state without a page reload
				if (formElement.getAttribute('action')?.includes('updateProfile')) {
					const bioElement = formElement.elements.namedItem('bio') as HTMLTextAreaElement;
					data.user.bio = bioElement?.value;
				} else if (formElement.getAttribute('action')?.includes('addSkill')) {
					// Get the skill details that were just added
					const formData = new FormData(formElement);
					const isCustom = formData.get('isCustom') === 'true';
					const proficiency = parseInt(formData.get('proficiency') as string, 10);
					
					let skillName: string;
					let skillId: number;
					
					if (isCustom) {
						// Custom skill was added
						skillName = formData.get('skillName') as string;
						
						// Check if this skill already exists in our skills list
						const existingSkill = skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
						if (existingSkill) {
							skillId = existingSkill.id;
						} else {
							// This is a completely new skill, let's add it to our skills list
							// In a real app we'd get the ID from the server, but we'll estimate it here
							skillId = Math.max(...skills.map(s => s.id)) + 1;
							skills = [...skills, { id: skillId, name: skillName, category: 'user-added' }];
							filteredSkills = [...skills]; // Update filtered list too
						}
					} else {
						// Existing skill was selected
						skillId = parseInt(formData.get('skillId') as string, 10);
						const skill = skills.find(s => s.id === skillId);
						skillName = skill ? skill.name : 'Unknown Skill';
					}
					
					// Add the new skill to the user's skills list
					const newSkill = {
						id: skillId,
						name: skillName,
						proficiency: proficiency,
						verified: false
					};
					
					userSkills = [...userSkills, newSkill];
				} else if (formElement.getAttribute('action')?.includes('updateSkill')) {
					// Update the skill proficiency locally
					const skillIdElement = formElement.elements.namedItem('skillId') as HTMLInputElement;
					const proficiencyElement = formElement.elements.namedItem('proficiency') as HTMLSelectElement;
					if (skillIdElement && proficiencyElement) {
						const skillId = parseInt(skillIdElement.value);
						const proficiency = parseInt(proficiencyElement.value);
						const skillIndex = userSkills.findIndex(s => s.id === skillId);
						if (skillIndex !== -1) {
							userSkills[skillIndex].proficiency = proficiency;
							userSkills = [...userSkills]; // Trigger reactivity
						}
					}
				} else if (formElement.getAttribute('action')?.includes('removeSkill')) {
					// Remove the skill locally
					const skillIdElement = formElement.elements.namedItem('skillId') as HTMLInputElement;
					if (skillIdElement) {
						const skillId = parseInt(skillIdElement.value);
						userSkills = userSkills.filter(s => s.id !== skillId);
					}
				}
			} else if (result.type === 'failure') {
				// Handle failure scenario - possibly display an error message
				console.error('Action failed:', result);
			}
			// Close modals on success
			if (result.type === 'success' && showAddSkillModal) {
				showAddSkillModal = false;
				newSkillName = '';
				newSkillProficiency = 3;
				customSkill = false;
				selectedSkillId = null;
			}
		};
	}
	
	// Filter skills based on search term
	function filterSkills() {
		if (!searchTerm) {
			filteredSkills = [...skills];
			return;
		}
		
		filteredSkills = skills.filter(skill => 
			skill.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}
	
	// Toggle add skill modal
	function toggleAddSkillModal() {
		showAddSkillModal = !showAddSkillModal;
		if (showAddSkillModal) {
			searchTerm = '';
			newSkillName = '';
			newSkillProficiency = 3;
			customSkill = false;
			selectedSkillId = null;
			filterSkills();
		}
	}
	
	// Get proficiency display
	function getProficiencyDisplay(level: number | null): string {
		if (level === null) return "Not specified";
		
		switch (level) {
			case 1: return "Beginner";
			case 2: return "Elementary";
			case 3: return "Intermediate";
			case 4: return "Advanced";
			case 5: return "Expert";
			default: return "Not specified";
		}
	}
	
	// Get proficiency class for color coding
	function getProficiencyClass(level: number | null): string {
		if (level === null) return "bg-gray-500";
		
		switch (level) {
			case 1: return "bg-blue-500";
			case 2: return "bg-teal-500";
			case 3: return "bg-green-500";
			case 4: return "bg-yellow-500";
			case 5: return "bg-red-500";
			default: return "bg-gray-500";
		}
	}
	
	// Handle skill selection
	function selectSkill(skillId: number) {
		selectedSkillId = skillId;
		customSkill = false;
	}
	
	// Toggle custom skill mode
	function toggleCustomSkillMode() {
		customSkill = !customSkill;
		if (customSkill) {
			selectedSkillId = null;
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-3xl font-bold mb-8">User Profile</h1>
		
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- User Information -->
			<div class="col-span-1">
				<div class="bg-black border border-white p-6 mb-4">
					<div class="flex flex-col items-center">
						<div class="w-24 h-24 rounded-full border-2 border-white mb-4 overflow-hidden">
							<img 
								src={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.username)}&background=random&size=128`} 
								alt="Profile Avatar" 
								class="w-full h-full"
							/>
						</div>
					<h2 class="text-xl font-bold">{data.user.username}</h2>
					
					{#if data.user.bio}
						<p class="text-sm text-gray-300 mt-2">{data.user.bio}</p>
					{:else}
						<p class="text-gray-500 mt-2 italic text-center">No bio provided</p>
					{/if}
					</div>
					
					<!-- Edit Profile Form -->
					<form method="post" action="?/updateProfile" use:enhance class="mt-6 space-y-4">
						<div>
							<label for="bio" class="block text-sm font-medium text-white mb-1">Bio (optional)</label>
							<textarea
								id="bio"
								name="bio"
								rows="3"
								class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
								placeholder="Tell us about yourself..."
							>{data.user.bio || ''}</textarea>
						</div>
						
						<button
							type="submit"
							class="w-full border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
						>
							Update Profile
						</button>
					</form>
				</div>
			</div>
			
			<!-- Skills Section -->
			<div class="col-span-1 lg:col-span-2">
				<div class="bg-black border border-white p-6 mb-4">
					<div class="flex justify-between items-center mb-4">
						<h2 class="text-xl font-bold">Skills</h2>
						<button
							onclick={toggleAddSkillModal}
							class="border-2 border-white bg-black px-4 py-1 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
						>
							Add Skill
						</button>
					</div>
					
					{#if userSkills.length > 0}
						<div class="space-y-3">
							{#each userSkills as skill}
								<div class="border border-white/20 bg-black/30 p-3 flex justify-between items-center">
									<div>
										<div class="flex items-center">
											<span class="font-medium">{skill.name}</span>
											{#if skill.verified}
												<span class="ml-2 bg-green-600/30 text-xs border border-green-500 px-1 py-0.5 rounded">
													Verified
												</span>
											{/if}
										</div>
										<div class="mt-1 flex items-center">
											<div class="h-2 w-20 bg-gray-700 rounded">
												<div 
													class="{getProficiencyClass(skill.proficiency)} h-full rounded" 
													style="width: {skill.proficiency ? (skill.proficiency * 20) : 0}%"
												>
												</div>
											</div>
											<span class="text-gray-400 text-xs ml-2">{getProficiencyDisplay(skill.proficiency)}</span>
										</div>
									</div>
									
									<div class="flex space-x-2">
										<form method="post" action="?/updateSkill" use:enhance>
											<input type="hidden" name="skillId" value={skill.id} />
											<select 
												name="proficiency" 
												class="border border-white/30 bg-black text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white"
												onchange={(e) => {e.currentTarget.form?.requestSubmit()}}
											>
												<option value="2">Elementary</option>
												<option value="3">Intermediate</option>
												<option value="4">Advanced</option>
												<option value="5">Expert</option>
											</select>
										</form>
										<form method="post" action="?/removeSkill" use:enhance>
											<input type="hidden" name="skillId" value={skill.id} />
											<button
												type="submit"
												class="bg-red-900/40 hover:bg-red-900/60 border border-red-600/50 text-white text-xs px-2 py-1 rounded"
											>
												Remove
											</button>
										</form>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500 italic">
							<p>No skills added yet. Add skills to showcase your expertise.</p>
						</div>
					{/if}
				</div>
				
				<!-- Recent Activity - Placeholder for future implementation -->
				<div class="bg-black border border-white p-6">
					<h2 class="text-xl font-bold mb-4">Recent Activity</h2>
					<div class="text-gray-500 italic">
						Activity tracking coming soon...
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Add Skill Modal -->
{#if showAddSkillModal}
	<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
		<div class="bg-black p-8 shadow-xl border-2 border-white max-w-md w-full">
			<h2 class="text-xl font-bold text-white mb-4">Add Skill</h2>
			
			<div class="mb-4 flex space-x-2">
				<button
					onclick={() => {customSkill = false; selectedSkillId = null;}}
					class="flex-1 px-3 py-2 border {!customSkill ? 'border-white bg-white/10' : 'border-white/30'}"
				>
					Select Existing
				</button>
				<button
					onclick={() => toggleCustomSkillMode()}
					class="flex-1 px-3 py-2 border {customSkill ? 'border-white bg-white/10' : 'border-white/30'}"
				>
					Add Custom
				</button>
			</div>
			
			<form method="post" action="?/addSkill" use:enhance={enhanceForm}>
				{#if customSkill}
					<!-- Custom skill input -->
					<div class="mb-4">
						<label for="skillName" class="block text-sm font-medium text-white mb-1">Skill Name</label>
						<input
							id="skillName"
							name="skillName"
							type="text"
							bind:value={newSkillName}
							required
							class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
							placeholder="Enter skill name"
						/>
						<input type="hidden" name="isCustom" value="true" />
					</div>
				{:else}
					<!-- Existing skill selection -->
					<div class="mb-4">
						<label for="skillSearch" class="block text-sm font-medium text-white mb-1">Search Skills</label>
						<input
							id="skillSearch"
							type="text"
							bind:value={searchTerm}
							oninput={filterSkills}
							class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white mb-2"
							placeholder="Search for skills..."
						/>
						
						<div class="border border-white/30 max-h-40 overflow-y-auto p-2">
							{#if filteredSkills.length > 0}
								{#each filteredSkills as skill}
									<button 
										type="button"
										class="w-full text-left p-2 cursor-pointer hover:bg-white/10 {selectedSkillId === skill.id ? 'bg-white/10 border-l-4 border-white' : ''}"
										onclick={() => selectSkill(skill.id)}
									>
										<div class="font-medium">{skill.name}</div>
										{#if skill.category}
											<div class="text-xs text-gray-400">{skill.category}</div>
										{/if}
									</button>
								{/each}
							{:else}
								<div class="p-2 text-gray-500 italic">No skills found</div>
							{/if}
						</div>
						<input type="hidden" name="skillId" value={selectedSkillId} />
					</div>
				{/if}
				
				<div class="mb-6">
					<label for="proficiency" class="block text-sm font-medium text-white mb-1">Proficiency Level</label>
					<div class="flex items-center">
						<input
							id="proficiency"
							type="range"
							name="proficiency"
							min="1"
							max="5"
							bind:value={newSkillProficiency}
							class="w-full"
						/>
						<span class="ml-2 w-32">{getProficiencyDisplay(newSkillProficiency)}</span>
					</div>
				</div>
				
				<div class="flex space-x-4">
					<button 
						type="button"
						onclick={toggleAddSkillModal}
						class="flex-1 px-4 py-2 bg-black text-white border-2 border-white hover:bg-white/10 transition-colors duration-200"
					>
						Cancel
					</button>
					<button 
						type="submit"
						class="flex-1 px-4 py-2 bg-white text-black border-2 border-white hover:bg-white/80 transition-colors duration-200"
						disabled={!customSkill && selectedSkillId === null}
					>
						Add Skill
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
