<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Network, type Node, type Edge } from 'vis-network';
	import { DataSet } from 'vis-data';

	// Component props
	export let tasks: {
		backlog?: any[];
		todo?: any[];
		'in-progress'?: any[];
		done?: any[];
	} = { backlog: [], todo: [], 'in-progress': [], done: [] };
	export let skills: any[] = [];
	export let users: any[] = [];
	export let taskSkills: Record<number, { id: number; name: string }[]> = {};
	export let userSkills: Record<
		string,
		{ id: string; username: string; skills: { id: number; name: string; proficiency?: number }[] }
	> = {};
	export let height: string = '600px';
	export let width: string = '100%';

	// Internal state
	let container: HTMLElement;
	let network: any;
	let selectedNode: any = null;
	let infoVisible = false;

	// Maps for tracking skills relationships
	const taskSkillMap: Record<number, number[]> = {};
	const userSkillMap: Record<string, number[]> = {};

	function resolveAssignees(task: any): { userId: string; username?: string }[] {
		if (Array.isArray(task?.assignees) && task.assignees.length > 0) {
			return task.assignees;
		}

		if (task?.assignedToId) {
			return [{ userId: task.assignedToId, username: task.assignedToUsername }];
		}

		return [];
	}

	// Create the graph data structure
	function createGraphData() {
		// Create node datasets
		const nodes = new DataSet<Node>();
		const edges = new DataSet<Edge>();

		// Debug and track visualization creation
		console.log('Creating sphere visualization with data:', {
			tasks,
			users,
			skills,
			taskSkills,
			userSkills
		});

		// Add task nodes
		const allTasks = [
			...(tasks.backlog || []),
			...(tasks.todo || []),
			...(tasks['in-progress'] || []),
			...(tasks.done || [])
		];

		// First pass: Add all task and user nodes
		allTasks.forEach((task) => {
			// Add task node with enhanced styling
			nodes.add({
				id: `task-${task.id}`,
				label: truncateLabel(task.title),
				title: task.description ? `${task.title}\n\n${task.description}` : task.title,
				group: 'task',
				shape: 'box',
				font: { color: '#ffffff', face: 'Arial', size: 14 },
				color: {
					background: getPriorityColor(task.priority),
					border: '#ffffff',
					highlight: { background: '#ffffff', border: '#000000' }
				},
				borderWidth: 2
			});

			// Track skills for this task
			if (taskSkills[task.id]) {
				taskSkillMap[task.id] = taskSkills[task.id].map((skill) => skill.id);
			}

			// Add task-user edges for assigned tasks
			const assignees = resolveAssignees(task);
			assignees.forEach((assignee) => {
				edges.add({
					from: `user-${assignee.userId}`,
					to: `task-${task.id}`,
					arrows: 'to',
					color: { color: '#10b981', opacity: 1.0 }, // Bright green color
					width: 3,
					label: 'assigned',
					font: {
						color: '#10b981',
						size: 14,
						face: 'Arial',
						background: 'rgba(0, 0, 0, 0.7)',
						strokeWidth: 2
					}
				});
			});
		});

		// Add user nodes for all members
		users.forEach((member) => {
			const userId = member.userId;
			const username = member.username;

			nodes.add({
				id: `user-${userId}`,
				label: username,
				group: 'user',
				shape: 'circularImage',
				image: getAvatarUrl(username),
				size: 40,
				borderWidth: 3,
				color: {
					border: '#4ade80',
					background: '#18181b',
					highlight: { background: '#4ade80', border: '#ffffff' }
				},
				font: { color: '#4ade80', size: 16, face: 'Arial' }
			});

			// Track skills for this user if they have any
			if (userSkills[userId]) {
				userSkillMap[userId] = userSkills[userId].skills.map((skill) => skill.id);
			} else {
				userSkillMap[userId] = []; // Empty skills array for users without skills
			}
		});

		// Create skill connections between users and tasks
		// This creates visible connections between users and tasks that share skills

		// For every task in all columns
		allTasks.forEach((task) => {
			const assignedUserIds = new Set(resolveAssignees(task).map((assignee) => assignee.userId));
			// For every user
			users.forEach((member) => {
				const userId = member.userId;

				// Skip if this user is already assigned to the task (we already have a different connection)
				if (assignedUserIds.has(userId)) return;

				// Get task skills
				const taskSkillsList = taskSkills[task.id] || [];
				const taskSkillIds = taskSkillsList.map((skill) => Number(skill.id));

				// Skip tasks with no skills defined
				if (taskSkillIds.length === 0) return;

				// Get user skills
				const userSkillsObj = userSkills[userId];
				if (!userSkillsObj || !userSkillsObj.skills) return;

				const userSkillIds = userSkillsObj.skills.map((skill) => Number(skill.id));

				// Skip users with no skills
				if (userSkillIds.length === 0) return;

				// Find matching skills by comparing IDs
				const matchingSkills: { id: number; name: string }[] = [];

				// Check each task skill against each user skill
				taskSkillsList.forEach((taskSkill) => {
					const taskSkillId = Number(taskSkill.id);

					// If user has this skill
					if (userSkillIds.includes(taskSkillId)) {
						matchingSkills.push({
							id: taskSkillId,
							name: taskSkill.name
						});
					}
				});

				// Create yellow connection if there are matching skills
				if (matchingSkills.length > 0) {
					const skillNames = matchingSkills.map((skill) => skill.name).join(', ');

					// Calculate edge width based on number of matching skills (more matches = thicker line)
					const edgeWidth = Math.min(1 + matchingSkills.length, 8); // Cap width at 8

					// Create a prominent visible edge showing the skill match
					edges.add({
						id: `skill-match-${userId}-${task.id}`,
						from: `user-${userId}`,
						to: `task-${task.id}`,
						color: { color: '#FBBF24', opacity: 0.9 }, // Slightly transparent yellow
						arrows: {
							to: { enabled: true, scaleFactor: 0.5 } // Smaller arrow
						},
						dashes: [5, 3], // Make dash pattern more visible
						width: edgeWidth, // Make width based on number of matches
						title: `Matching skills: ${skillNames}`,
						label: matchingSkills.length > 1 ? `${matchingSkills.length} skills` : skillNames,
						font: {
							color: '#FBBF24',
							size: 12,
							background: 'rgba(0, 0, 0, 0.8)',
							strokeWidth: 2
						},
						physics: true,
						smooth: {
							enabled: true,
							type: 'dynamic',
							roundness: 0.5
						}
					});
				}
			});
		});

		return { nodes, edges };
	}

	// Get a color based on task priority
	function getPriorityColor(priority: string): string {
		switch (priority?.toLowerCase()) {
			case 'high':
				return '#ef4444'; // Red
			case 'medium':
				return '#f59e0b'; // Amber
			case 'low':
				return '#10b981'; // Green
			default:
				return '#6366f1'; // Indigo
		}
	}

	// Generate an avatar URL (uses UI Avatars service as a placeholder)
	function getAvatarUrl(username: string): string {
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=128`;
	}

	// Truncate long labels to keep the graph clean
	function truncateLabel(text: string, maxLength: number = 20): string {
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
	}

	// Get proficiency display text
	function getProficiencyDisplay(level: number | null): string {
		if (level === null) return 'Not specified';

		switch (level) {
			case 1:
				return 'Beginner';
			case 2:
				return 'Elementary';
			case 3:
				return 'Intermediate';
			case 4:
				return 'Advanced';
			case 5:
				return 'Expert';
			default:
				return 'Not specified';
		}
	}

	// Handle node click
	function handleNodeClick(params: any) {
		if (params.nodes.length > 0) {
			const nodeId = params.nodes[0];
			const nodeType = nodeId.split('-')[0];
			const nodeData = getNodeData(nodeId);

			// Debug logging to see what's happening when a node is clicked
			console.log('Node clicked:', { nodeId, nodeType, nodeData });

			selectedNode = {
				id: nodeId,
				type: nodeType,
				data: nodeData
			};

			// Always show the info panel when a node is clicked
			infoVisible = true;
		} else {
			selectedNode = null;
			infoVisible = false;
		}
	}

	// Get node data based on ID
	function getNodeData(nodeId: string) {
		const [type, id] = nodeId.split('-');

		switch (type) {
			case 'task': {
				const allTasks = [
					...(tasks.backlog || []),
					...(tasks.todo || []),
					...(tasks['in-progress'] || []),
					...(tasks.done || [])
				];
				return allTasks.find((task) => task.id.toString() === id);
			}
			case 'skill':
				return skills.find((skill) => skill.id.toString() === id);
			case 'user': {
				// First try to find the user in the userSkills object
				const userSkillData = userSkills[id];

				if (userSkillData) {
					// User found in userSkills
					console.log('Found user in userSkills:', userSkillData);
					return userSkillData;
				} else {
					// If not found in userSkills, try to find in users array
					console.log('User not found in userSkills, checking users array...');
					const user = users.find((u) => u.userId === id);

					if (user) {
						console.log('Found user in users array:', user);
						// Create a compatible data structure
						return {
							id: user.userId,
							username: user.username,
							skills: [] // No skills available from users array
						};
					}

					console.log('User not found in either source:', id);
					return null;
				}
			}
			default:
				return null;
		}
	}

	// Initialize network visualization
	onMount(() => {
		// Create network data
		const data = createGraphData();

		// Configuration options for the network
		const options = {
			physics: {
				enabled: true,
				barnesHut: {
					gravitationalConstant: -2000,
					centralGravity: 0.3,
					springLength: 95,
					springConstant: 0.04,
					damping: 0.09,
					avoidOverlap: 0.1
				},
				solver: 'barnesHut'
			},
			interaction: {
				hover: true,
				tooltipDelay: 300
			},
			edges: {
				smooth: {
					enabled: true,
					type: 'continuous',
					roundness: 0.5
				},
				length: 200
			},
			groups: {
				task: {
					shape: 'box',
					margin: 10,
					widthConstraint: {
						minimum: 100,
						maximum: 200
					}
				},
				skill: {
					shape: 'hexagon'
				},
				user: {
					shape: 'circularImage'
				}
			}
		};

		// Create network
		network = new Network(container, data, options);

		// Set up events
		network.on('click', handleNodeClick);
	});

	// Clean up when component is destroyed
	onDestroy(() => {
		if (network) {
			network.destroy();
			network = null;
		}
	});

	// Process tasks into a flat array for visualization
	$: processedTasks = [
		...(tasks.backlog || []),
		...(tasks.todo || []),
		...(tasks['in-progress'] || []),
		...(tasks.done || [])
	];
</script>

<div class="sphere-visualization">
	<div class="visualization-container" bind:this={container} style:height style:width></div>

	{#if infoVisible && selectedNode}
		<div
			class="node-info rounded-md border border-white bg-black/70 p-4 shadow-lg backdrop-blur-sm"
		>
			<!-- Close button -->
			<button
				class="close-btn absolute top-2 right-2 text-white hover:text-gray-300"
				on:click={() => (infoVisible = false)}>✕</button
			>

			<!-- Task info -->
			{#if selectedNode.type === 'task'}
				<div class="info-content text-white">
					<h3 class="mb-2 text-xl font-bold">{selectedNode.data.title}</h3>
					{#if selectedNode.data.description}
						<p class="mb-3 text-gray-300">{selectedNode.data.description}</p>
					{/if}
					<div class="grid grid-cols-2 gap-2 text-sm">
						<div>
							<span class="text-gray-400">Status:</span>
							<span class="capitalize">{selectedNode.data.status}</span>
						</div>
						<div>
							<span class="text-gray-400">Priority:</span>
							<span class="capitalize">{selectedNode.data.priority}</span>
						</div>
						<div>
							<span class="text-gray-400">Created by:</span>
							<span>{selectedNode.data.createdBy ? selectedNode.data.createdBy : 'Unknown'}</span>
						</div>
						{#if selectedNode.data.assignees && selectedNode.data.assignees.length > 0}
							<div>
								<span class="text-gray-400">Assigned to:</span>
								<span
									>{selectedNode.data.assignees
										.map((assignee: { username: string }) => assignee.username)
										.join(', ')}</span
								>
							</div>
						{:else if selectedNode.data.assignedToUsername}
							<div>
								<span class="text-gray-400">Assigned to:</span>
								<span>{selectedNode.data.assignedToUsername}</span>
							</div>
						{/if}
					</div>
					{#if taskSkills[selectedNode.data.id]}
						<div class="mt-4">
							<h4 class="mb-1 font-medium text-gray-300">Required Skills:</h4>
							<div class="flex flex-wrap gap-2">
								{#each taskSkills[selectedNode.data.id] as skill}
									<span class="rounded border border-purple-500 bg-purple-900/50 px-2 py-1 text-xs">
										{skill.name}
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- User info -->
			{:else if selectedNode.type === 'user'}
				<div class="info-content text-white">
					<div class="mb-4 flex items-center">
						<img
							src={getAvatarUrl(selectedNode.data.username)}
							alt={selectedNode.data.username}
							class="mr-4 h-16 w-16 rounded-full border-2 border-white"
						/>
						<h3 class="text-xl font-bold">{selectedNode.data.username}</h3>
					</div>
					<!-- User skills section -->
					<div class="mt-4">
						<h4 class="mb-2 font-medium text-gray-300">Skills:</h4>
						{#if selectedNode.data?.skills && Array.isArray(selectedNode.data.skills) && selectedNode.data.skills.length > 0}
							<!-- User has skills directly in the data object -->
							<div class="mb-4 flex flex-wrap gap-2">
								{#each selectedNode.data.skills as skill}
									<span
										class="flex items-center rounded border border-green-500 bg-green-900/50 px-2 py-1 text-xs"
									>
										<span>{skill.name}</span>
										{#if skill.proficiency !== undefined && skill.proficiency !== null}
											<span
												class="ml-1 rounded border border-green-400 bg-green-700/50 px-1 py-0.5 text-xs"
											>
												{getProficiencyDisplay(skill.proficiency)}
											</span>
										{/if}
									</span>
								{/each}
							</div>
						{:else if selectedNode.data?.id && userSkillMap[selectedNode.data.id] && userSkillMap[selectedNode.data.id].length > 0}
							<!-- Fallback to userSkillMap if direct skills aren't available -->
							<div class="mb-4 flex flex-wrap gap-2">
								{#each userSkillMap[selectedNode.data.id] as skillId}
									{#if skills.find((s) => s.id === skillId)}
										<span class="rounded border border-green-500 bg-green-900/50 px-2 py-1 text-xs">
											{skills.find((s) => s.id === skillId).name}
										</span>
									{/if}
								{/each}
							</div>
						{:else}
							<!-- Add debugging info to help trace the issue -->
							<p class="mb-4 text-sm text-gray-400 italic">No skills specified</p>
							<!-- Hidden debugging info that will appear in console -->
							<script>
								console.log('Debug - No skills found:', {
									userData: selectedNode.data,
									userSkillMapEntry: selectedNode.data?.id
										? userSkillMap[selectedNode.data.id]
										: null,
									allSkills: skills
								});
							</script>
						{/if}

						<!-- Related tasks section -->
						<h4 class="mb-2 font-medium text-gray-300">Matching Tasks:</h4>
						<div class="space-y-2">
							{#each processedTasks.filter((task) => {
								// Get task skills
								const taskSkillIds = (taskSkills[task.id] || []).map((s) => s.id);
								// Get user skills
								const userSkillIds = (selectedNode.data.skills || []).map((s: { id: number }) => s.id);
								// Check if there are any matching skills
								return taskSkillIds.some((skillId) => userSkillIds.includes(skillId));
							}) as matchingTask}
								<div class="rounded border border-yellow-500/30 bg-yellow-900/20 p-2 text-sm">
									<div class="flex items-center justify-between">
										<span>{matchingTask.title}</span>
										<span class="rounded bg-white/10 px-2 py-0.5 text-xs capitalize"
											>{matchingTask.priority}</span
										>
									</div>
									{#if resolveAssignees(matchingTask).some((assignee) => assignee.userId === selectedNode.data.id)}
										<span class="mt-1 block text-xs text-green-400">Assigned to this user</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Skill info -->
			{:else if selectedNode.type === 'skill'}
				<div class="info-content text-white">
					<h3 class="mb-4 text-xl font-bold">{selectedNode.data.name}</h3>

					<!-- Find tasks requiring this skill -->
					<div class="mb-4">
						<h4 class="mb-1 font-medium text-gray-300">Tasks requiring this skill:</h4>
						<div class="space-y-2">
							{#each Object.entries(taskSkills) as [taskId, skills]}
								{#if skills.some((s) => s.id === parseInt(selectedNode.data.id))}
									{#if processedTasks.find((t) => t.id === parseInt(taskId))}
										<div class="rounded border border-purple-500/30 bg-purple-900/20 p-2 text-sm">
											{processedTasks.find((t) => t.id === parseInt(taskId)).title}
										</div>
									{/if}
								{/if}
							{/each}
						</div>
					</div>

					<!-- Find users with this skill -->
					<div>
						<h4 class="mb-1 font-medium text-gray-300">Users with this skill:</h4>
						<div class="space-y-2">
							{#each Object.values(userSkills) as user}
								{#if user.skills.some((s) => s.id === parseInt(selectedNode.data.id))}
									<div
										class="flex items-center rounded border border-green-500/30 bg-green-900/20 p-2 text-sm"
									>
										<img
											src={getAvatarUrl(user.username)}
											alt={user.username}
											class="mr-2 h-6 w-6 rounded-full"
										/>
										<span>{user.username}</span>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.sphere-visualization {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.visualization-container {
		background-color: #18181b;
	}

	.node-info {
		position: absolute;
		right: 16px;
		top: 16px;
		width: 320px;
		max-height: 80%;
		overflow-y: auto;
		z-index: 1000;
	}

	.close-btn {
		cursor: pointer;
	}
</style>
