<script lang="ts">
    import { enhance } from '$app/forms';
    
    // Form state
    let showSkillModal = $state(false);
    let skillSearchTerm = $state('');
</script>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Settings</h1>
        
        <div class="grid grid-cols-1 gap-8">
            <!-- User Settings -->
            <div class="bg-black border border-white p-6">
                <h2 class="text-xl font-bold mb-4">Account Settings</h2>
                
                <!-- Change Password -->
                <form method="post" action="?/changePassword" use:enhance class="mb-8">
                    <h3 class="text-lg font-semibold mb-3">Change Password</h3>
                    <div class="space-y-4">
                        <div>
                            <label for="currentPassword" class="block text-sm font-medium text-white mb-1">Current Password</label>
                            <input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                required
                                class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                            />
                        </div>
                        <div>
                            <label for="newPassword" class="block text-sm font-medium text-white mb-1">New Password</label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                required
                                class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                            />
                        </div>
                        <div>
                            <label for="confirmPassword" class="block text-sm font-medium text-white mb-1">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                            />
                        </div>
                        <button
                            type="submit"
                            class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
                        >
                            Update Password
                        </button>
                    </div>
                </form>
                
                <!-- Visualization Preferences -->
                <form method="post" action="?/updatePreferences" use:enhance>
                    <h3 class="text-lg font-semibold mb-3">Visualization Preferences</h3>
                    <div class="space-y-4">
                        <div>
                            <label for="visualizationMode" class="block text-sm font-medium text-white mb-1">Default Visualization Mode</label>
                            <select
                                id="visualizationMode"
                                name="visualizationMode"
                                class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                            >
                                <option value="kanban">Kanban View</option>
                                <option value="sphere">Sphere Visualization</option>
                            </select>
                        </div>
                        <div>
                            <label for="skillEdgeDetail" class="block text-sm font-medium text-white mb-1">Skill Edge Detail Level</label>
                            <select
                                id="skillEdgeDetail"
                                name="skillEdgeDetail"
                                class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
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
                            <label for="showSkillProficiency" class="ml-2 text-sm text-white">Show Skill Proficiency Labels</label>
                        </div>
                        <div class="flex items-center">
                            <input
                                id="highlightMatches"
                                name="highlightMatches"
                                type="checkbox"
                                class="h-4 w-4 border-white focus:ring-white"
                            />
                            <label for="highlightMatches" class="ml-2 text-sm text-white">Highlight Skill/Task Matches</label>
                        </div>
                        <button
                            type="submit"
                            class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
                        >
                            Save Preferences
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Skill Management -->
            <div class="bg-black border border-white p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">Skill Management</h2>
                    <button
                        onclick={() => showSkillModal = !showSkillModal}
                        class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
                    >
                        Request Skill Verification
                    </button>
                </div>
                
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Skill Verification Status</h3>
                    <p class="text-gray-400 text-sm mb-3">
                        Verified skills demonstrate expertise and appear more prominently in visualizations.
                        Request verification for your skills, and they will be reviewed based on your 
                        task history and contributions.
                    </p>
                    
                    <div class="border border-white/30 rounded p-4">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <span class="font-medium">JavaScript</span>
                                <span class="ml-2 text-xs bg-green-600/30 border border-green-500 px-1 py-0.5 rounded">Verified</span>
                            </div>
                            <span class="text-gray-400 text-sm">Verified on April 10, 2025</span>
                        </div>
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <span class="font-medium">TypeScript</span>
                                <span class="ml-2 text-xs bg-yellow-600/30 border border-yellow-500 px-1 py-0.5 rounded">Pending</span>
                            </div>
                            <span class="text-gray-400 text-sm">Requested on April 12, 2025</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <span class="font-medium">React</span>
                                <span class="ml-2 text-xs bg-gray-600/30 border border-gray-500 px-1 py-0.5 rounded">Not Verified</span>
                            </div>
                            <button class="text-white text-xs underline hover:text-blue-300">Request Verification</button>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold mb-3">Skill Categories</h3>
                    <p class="text-gray-400 text-sm mb-3">
                        Add custom skill categories to better organize your skills in the visualization.
                    </p>
                    
                    <form method="post" action="?/addSkillCategory" use:enhance class="space-y-4">
                        <div>
                            <label for="categoryName" class="block text-sm font-medium text-white mb-1">New Category Name</label>
                            <div class="flex">
                                <input
                                    id="categoryName"
                                    name="categoryName"
                                    type="text"
                                    required
                                    class="flex-1 border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                                    placeholder="Enter category name"
                                />
                                <button
                                    type="submit"
                                    class="ml-2 border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </form>
                    
                    <div class="mt-4">
                        <div class="flex flex-wrap gap-2">
                            <span class="bg-purple-900/50 text-xs px-2 py-1 rounded border border-purple-500">Programming</span>
                            <span class="bg-purple-900/50 text-xs px-2 py-1 rounded border border-purple-500">Design</span>
                            <span class="bg-purple-900/50 text-xs px-2 py-1 rounded border border-purple-500">Frontend</span>
                            <span class="bg-purple-900/50 text-xs px-2 py-1 rounded border border-purple-500">Backend</span>
                            <span class="bg-purple-900/50 text-xs px-2 py-1 rounded border border-purple-500">AI/ML</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Skill Verification Modal -->
{#if showSkillModal}
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div class="bg-black p-8 shadow-xl border-2 border-white max-w-md w-full">
            <h2 class="text-xl font-bold text-white mb-4">Request Skill Verification</h2>
            
            <form method="post" action="?/requestVerification" use:enhance class="space-y-4">
                <div>
                    <label for="skillVerification" class="block text-sm font-medium text-white mb-1">Choose Skill</label>
                    <select
                        id="skillVerification"
                        name="skillId"
                        class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        <option value="" disabled selected>Select a skill</option>
                        <option value="1">JavaScript</option>
                        <option value="2">TypeScript</option>
                        <option value="3">React</option>
                        <option value="4">Node.js</option>
                    </select>
                </div>
                
                <div>
                    <label for="verificationNote" class="block text-sm font-medium text-white mb-1">
                        Verification Note (optional)
                    </label>
                    <textarea
                        id="verificationNote"
                        name="verificationNote"
                        rows="3"
                        class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                        placeholder="Briefly explain your experience with this skill..."
                    ></textarea>
                </div>
                
                <div class="flex space-x-4 mt-6">
                    <button 
                        type="button"
                        onclick={() => showSkillModal = false}
                        class="flex-1 px-4 py-2 bg-black text-white border-2 border-white hover:bg-white/10 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        class="flex-1 px-4 py-2 bg-white text-black border-2 border-white hover:bg-white/80 transition-colors duration-200"
                    >
                        Request
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
