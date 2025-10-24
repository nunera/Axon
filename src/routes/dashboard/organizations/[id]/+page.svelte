<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageServerData } from './$types';
	import { fly, fade } from 'svelte/transition';
	import SphereVisualization from '$lib/components/SphereVisualization.svelte';

	// Define the expected shape of a skill
		type Skill = { id: number; name: string; category?: string | null; proficiency?: number };

	// Extend PageServerData locally to include the optional skills property
	type ExtendedPageData = PageServerData & {
		skills?: Skill[];
		taskSkills?: { [taskId: number]: Skill[] };
		userSkills?: { [userId: string]: Skill[] };
		pendingInvites?: { id: number; inviteeUsername: string; invitedAt: Date; status?: string }[];
	};

	let { data }: { data: ExtendedPageData } = $props();

	// Active tab state
	let activeTab = $state('about');

	// State for member invitation modal
	let showInviteModal = $state(false);
	let inviteUsername = $state('');
	let inviteMessage = $state('');
	let inviteError = $state('');
	
	// State for leave organization confirmation modal
	let showLeaveConfirmation = $state(false);
	let showDeleteOrganizationModal = $state(false);

	// State for create task modal
	let showCreateTaskModal = $state(false);
	let taskTitle = $state('');
	let taskDescription = $state('');
	let taskStatus = $state('backlog');
	let taskPriority = $state('medium');
	let assignedUserIds = $state<string[]>([]);
	let selectedSkillIds = $state<number[]>([]);
	let skillSearchTerm = $state('');

	let availableSkills: Skill[] = [...(data.skills ?? [])];
	let filteredSkills = $state<Skill[]>([...availableSkills]);

	// Edit task modal state
	let showEditTaskModal = $state(false);
	let editingTaskId = $state<number | null>(null);
	let editTaskTitle = $state('');
	let editTaskDescription = $state('');
	let editTaskStatus = $state('backlog');
	let editTaskPriority = $state('medium');
let editAssignedUserIds = $state<string[]>([]);
let editSkillIds = $state<number[]>([]);
let editSkillSearchTerm = $state('');
let editFilteredSkills = $state<Skill[]>([...availableSkills]);
let taskEditError = $state('');

	// Drag state
	let draggedTask: any = null;
	let draggedColumn: string = '';
let dragOverColumn: string = '';
let isDragging = $state(false);

$effect(() => {
	availableSkills = [...(data.skills ?? [])];
	if (!showCreateTaskModal) {
		filteredSkills = [...availableSkills];
	}
	if (!showEditTaskModal) {
		editFilteredSkills = [...availableSkills];
	}
});

const createSelectedSkills = $derived(
	selectedSkillIds
		.map((id) => availableSkills.find((skill) => skill.id === id))
		.filter((skill): skill is Skill => Boolean(skill))
);

const editSelectedSkills = $derived(
	editSkillIds
		.map((id) => availableSkills.find((skill) => skill.id === id))
		.filter((skill): skill is Skill => Boolean(skill))
);

	function toggleInviteModal() {
		showInviteModal = !showInviteModal;
		if (showInviteModal) {
			inviteUsername = '';
			inviteMessage = '';
			inviteError = '';
		}
	}

	function toggleLeaveConfirmation() {
		showLeaveConfirmation = !showLeaveConfirmation;
	}

	function closeInviteModal() {
		showInviteModal = false;
	}

	function closeLeaveConfirmation() {
		showLeaveConfirmation = false;
	}

	function openDeleteOrganizationModal() {
		showDeleteOrganizationModal = true;
	}

	function closeDeleteOrganizationModal() {
		showDeleteOrganizationModal = false;
	}

	const enhanceLeaveOrganization = () => {
		return async ({ result }: { result: any }) => {
			if (result.type === 'redirect') {
				closeLeaveConfirmation();
				await goto(result.location);
			}
		};
	};

	const handleOverlayKeyDown = (event: KeyboardEvent, close: () => void) => {
		if (event.key === 'Escape') {
			close();
		}
	};

	function resetCreateTaskForm() {
		taskTitle = '';
		taskDescription = '';
		taskStatus = 'backlog';
		taskPriority = 'medium';
		assignedUserIds = [];
		selectedSkillIds = [];
		skillSearchTerm = '';
		filteredSkills = [...availableSkills];
	}

	function toggleCreateTaskModal() {
		showCreateTaskModal = !showCreateTaskModal;
		if (showCreateTaskModal) {
			resetCreateTaskForm();
		}
	}

	function closeCreateTaskModal() {
		showCreateTaskModal = false;
		resetCreateTaskForm();
	}

	function filterSkills() {
		if (!skillSearchTerm) {
			filteredSkills = [...availableSkills];
			return;
		}
		filteredSkills = availableSkills.filter((skill) =>
			skill.name.toLowerCase().includes(skillSearchTerm.toLowerCase())
		);
	}

	function toggleSkillSelection(skillId: number) {
		if (selectedSkillIds.includes(skillId)) {
			selectedSkillIds = selectedSkillIds.filter((id) => id !== skillId);
		} else {
			selectedSkillIds = [...selectedSkillIds, skillId];
		}
	}

	function filterEditSkills() {
		if (!editSkillSearchTerm) {
			editFilteredSkills = [...availableSkills];
			return;
		}
		editFilteredSkills = availableSkills.filter((skill) =>
			skill.name.toLowerCase().includes(editSkillSearchTerm.toLowerCase())
		);
	}

	function toggleEditSkillSelection(skillId: number) {
		if (editSkillIds.includes(skillId)) {
			editSkillIds = editSkillIds.filter((id) => id !== skillId);
		} else {
			editSkillIds = [...editSkillIds, skillId];
		}
	}

	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function handleDragStart(task: any, column: string) {
		draggedTask = task;
		draggedColumn = column;
		isDragging = true;
	}

	function handleDragOver(event: DragEvent, column: string) {
		event.preventDefault();
		dragOverColumn = column;
	}

	function handleDragEnd() {
		isDragging = false;
		draggedTask = null;
		draggedColumn = '';
		dragOverColumn = '';
	}

	function handleDrop(event: DragEvent, column: string) {
		event.preventDefault();
		if (draggedTask && draggedColumn !== column) {
			const form = document.getElementById('updateTaskForm') as HTMLFormElement;
			const taskIdInput = document.getElementById('updateTaskId') as HTMLInputElement;
			const statusInput = document.getElementById('updateTaskStatus') as HTMLInputElement;

			taskIdInput.value = draggedTask.id.toString();
			statusInput.value = column;

			form.requestSubmit();
		}
		handleDragEnd();
	}

	function openEditTaskModal(task: any, event?: MouseEvent) {
		event?.stopPropagation();
		if (isDragging) {
			return;
		}

		editingTaskId = task.id;
		editTaskTitle = task.title;
		editTaskDescription = task.description ?? '';
		editTaskStatus = task.status ?? 'backlog';
		editTaskPriority = task.priority ?? 'medium';
		editAssignedUserIds = task.assignees
			? task.assignees.map((assignee: { userId: string }) => assignee.userId)
			: task.assignedToId
				? [task.assignedToId]
				: [];
		editSkillIds = (data.taskSkills?.[task.id] ?? []).map((skill) => skill.id);
		editSkillSearchTerm = '';
		editFilteredSkills = [...availableSkills];
		taskEditError = '';
		showEditTaskModal = true;
	}

	function closeEditTaskModal() {
		showEditTaskModal = false;
		taskEditError = '';
		editingTaskId = null;
	}

	const enhanceUpdateTask = () => {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			if (result.type === 'success') {
				taskEditError = '';
				await update();
				closeEditTaskModal();
			} else if (result.type === 'failure') {
				taskEditError = typeof result.data?.error === 'string' ? result.data.error : 'Failed to update task';
			}
		};
	};

	const enhanceDeleteOrganization = () => {
		return async ({ result }: { result: any }) => {
			if (result.type === 'redirect') {
				closeDeleteOrganizationModal();
				await goto(result.location);
			}
		};
	};

	// Get task suggestion based on current tasks
	function getTaskSuggestion() {
		const suggestions = [
			'Consider breaking down larger tasks into smaller ones for better tracking',
			'Tasks with no recent activity might need attention',
			'Balancing task distribution among team members improves efficiency',
			'Regular updates help keep everyone informed of progress',
			'Adding skills to tasks helps match the right people to the right work'
		];

		return suggestions[Math.floor(Math.random() * suggestions.length)];
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
			<div>
				<h1 class="text-3xl font-bold mb-2">{data.organization.name}</h1>
				<p class="text-gray-400">Created {formatDate(data.organization.createdAt)}</p>
			</div>
			
			<div class="mt-4 md:mt-0 flex flex-wrap gap-3 justify-end">
				{#if data.userRole === 'admin'}
					<button
						onclick={toggleInviteModal}
						class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
					>
						Invite Member
					</button>
				{/if}

				{#if data.organization.createdById === data.userId}
					<button
						onclick={openDeleteOrganizationModal}
						class="border-2 border-red-500 bg-black px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200"
					>
						Delete Organization
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
		
		 <!-- Tab Navigation -->
		<div class="border-b border-white mb-6">
			<nav class="flex space-x-8">
				<button 
					class="py-4 px-2 border-b-2 {activeTab === 'about' ? 'border-white font-medium' : 'border-transparent text-gray-400 hover:text-white'}"
					onclick={() => activeTab = 'about'}
				>
					About
				</button>
				<button 
					class="py-4 px-2 border-b-2 {activeTab === 'members' ? 'border-white font-medium' : 'border-transparent text-gray-400 hover:text-white'}"
					onclick={() => activeTab = 'members'}
				>
					Members ({data.members.length})
				</button>
				<button 
					class="py-4 px-2 border-b-2 {activeTab === 'tasks' ? 'border-white font-medium' : 'border-transparent text-gray-400 hover:text-white'}"
					onclick={() => activeTab = 'tasks'}
				>
					Tasks
				</button>
				<button 
					class="py-4 px-2 border-b-2 {activeTab === 'visualization' ? 'border-white font-medium' : 'border-transparent text-gray-400 hover:text-white'}"
					onclick={() => activeTab = 'visualization'}
				>
					Visualization
				</button>
			</nav>
		</div>
		
		<!-- About Tab -->
		{#if activeTab === 'about'}
			<div class="bg-black border border-white p-6 shadow-xl" transition:fade={{ duration: 150 }}>
				<h2 class="text-xl font-semibold mb-4">About</h2>
				{#if data.organization.description}
					<p>{data.organization.description}</p>
				{:else}
					<p class="italic text-gray-500">No description provided</p>
				{/if}
			</div>
		{/if}
		
		<!-- Members Tab -->
		{#if activeTab === 'members'}
			<div class="bg-black border border-white p-6 shadow-xl" transition:fade={{ duration: 150 }}>
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

				{#if data.userRole === 'admin' && data.pendingInvites && data.pendingInvites.length > 0}
					<div class="mt-6 border border-white/30 bg-black/40 p-4">
						<h3 class="text-lg font-medium mb-3">Pending Invitations</h3>
						<ul class="space-y-2 text-sm text-gray-300">
							{#each data.pendingInvites as invite}
								<li class="flex justify-between">
									<span>@{invite.inviteeUsername}</span>
									<span class="text-gray-400">Sent {formatDate(invite.invitedAt)}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}
		
		<!-- Tasks Tab -->
		{#if activeTab === 'tasks'}
			<div transition:fade={{ duration: 150 }}>
				<!-- Tasks Header -->
				<div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
					<h2 class="text-xl font-semibold">Task Board</h2>
					<button 
						onclick={toggleCreateTaskModal}
						class="border-2 border-white bg-black px-4 py-2 font-medium text-white hover:bg-white hover:text-black transition-colors duration-200 mt-4 md:mt-0"
					>
						Create New Task
					</button>
				</div>
				
				<!-- AI Insight Banner -->
				<div class="mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-lg">
					<div class="flex items-center">
						<div class="mr-3">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
						<div>
							<p class="text-white font-medium">Jarvis</p>
							<p class="text-white/80 text-sm">{getTaskSuggestion()}</p>
						</div>
					</div>
				</div>
				
				<!-- Kanban Board -->
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<!-- Backlog Column -->
					<div 
						class="border border-white bg-black/30 rounded-lg p-4"
						role="region" aria-label="Backlog column"
						ondragover={(e) => handleDragOver(e, 'backlog')}
						ondrop={(e) => handleDrop(e, 'backlog')}
					>
						<h2 class="text-xl font-bold mb-4 flex items-center justify-between">
							Backlog
							<span class="text-sm font-normal bg-white/10 px-2 py-1 rounded">
								{data.tasks?.backlog?.length || 0}
							</span>
						</h2>
						
						{#if data.tasks?.backlog && data.tasks.backlog.length > 0}
							<div class="space-y-3">
								{#each data.tasks.backlog as task}
									<button 
										type="button"
										class="w-full text-left bg-black border border-white p-3 cursor-move"
										draggable="true"
										ondragstart={() => handleDragStart(task, 'backlog')}
										ondragend={handleDragEnd}
										onclick={(event) => openEditTaskModal(task, event)}
									>
										<h3 class="font-medium">{task.title}</h3>
										{#if task.description}
											<p class="text-sm text-gray-400 mt-1">{task.description}</p>
										{/if}
										<div class="flex items-center justify-between mt-3 gap-2">
										<span class="text-xs bg-white/10 px-2 py-0.5 rounded capitalize whitespace-nowrap">{task.priority}</span>
										{#if task.assignees?.length}
											<div class="flex flex-wrap justify-end gap-1">
												{#each task.assignees as assignee}
													<span class="text-xs bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500 whitespace-nowrap">
														@{assignee.username}
													</span>
												{/each}
											</div>
										{/if}
									</div>
										
										<!-- Show task skills -->
										{#if data.taskSkills && data.taskSkills[task.id] && data.taskSkills[task.id].length > 0}
											<div class="mt-2 flex flex-wrap gap-1">
												{#each data.taskSkills[task.id] as skill}
													<span class="text-xs bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-500">
														{skill.name}
													</span>
												{/each}
											</div>
										{/if}
									</button>
								{/each}
							</div>
						{:else}
							<p class="text-gray-400 text-sm italic">No tasks in backlog</p>
						{/if}
					</div>
					
					<!-- To Do Column -->
					<div 
						class="border border-white bg-black/30 rounded-lg p-4"
						role="region" aria-label="To do column"
						ondragover={(e) => handleDragOver(e, 'todo')}
						ondrop={(e) => handleDrop(e, 'todo')}
					>
						<h2 class="text-xl font-bold mb-4 flex items-center justify-between">
							To Do
							<span class="text-sm font-normal bg-white/10 px-2 py-1 rounded">
								{data.tasks?.todo?.length || 0}
							</span>
						</h2>
						
						{#if data.tasks?.todo && data.tasks.todo.length > 0}
							<div class="space-y-3">
								{#each data.tasks.todo as task}
									<button 
										type="button"
										class="w-full text-left bg-black border border-white p-3 cursor-move"
										draggable="true"
										ondragstart={() => handleDragStart(task, 'todo')}
										ondragend={handleDragEnd}
										onclick={(event) => openEditTaskModal(task, event)}
									>
										<h3 class="font-medium">{task.title}</h3>
										{#if task.description}
											<p class="text-sm text-gray-400 mt-1">{task.description}</p>
										{/if}
									<div class="flex items-center justify-between mt-3 gap-2">
										<span class="text-xs bg-white/10 px-2 py-0.5 rounded capitalize whitespace-nowrap">{task.priority}</span>
										{#if task.assignees?.length}
											<div class="flex flex-wrap justify-end gap-1">
												{#each task.assignees as assignee}
													<span class="text-xs bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500 whitespace-nowrap">
														@{assignee.username}
													</span>
												{/each}
											</div>
										{/if}
									</div>
										
										<!-- Show task skills -->
										{#if data.taskSkills && data.taskSkills[task.id] && data.taskSkills[task.id].length > 0}
											<div class="mt-2 flex flex-wrap gap-1">
												{#each data.taskSkills[task.id] as skill}
													<span class="text-xs bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-500">
														{skill.name}
													</span>
												{/each}
											</div>
										{/if}
									</button>
								{/each}
							</div>
						{:else}
							<p class="text-gray-400 text-sm italic">No tasks to do</p>
						{/if}
					</div>
					
					<!-- In Progress Column -->
					<div 
						class="border border-white bg-black/30 rounded-lg p-4"
						role="region" aria-label="In progress column"
						ondragover={(e) => handleDragOver(e, 'in-progress')}
						ondrop={(e) => handleDrop(e, 'in-progress')}
					>
						<h2 class="text-xl font-bold mb-4 flex items-center justify-between">
							In Progress
							<span class="text-sm font-normal bg-white/10 px-2 py-1 rounded">
								{data.tasks?.['in-progress']?.length || 0}
							</span>
						</h2>
						
						{#if data.tasks?.['in-progress'] && data.tasks['in-progress'].length > 0}
							<div class="space-y-3">
								{#each data.tasks['in-progress'] as task}
									<button 
										type="button"
										class="w-full text-left bg-black border border-white p-3 cursor-move"
										draggable="true"
										ondragstart={() => handleDragStart(task, 'in-progress')}
										ondragend={handleDragEnd}
										onclick={(event) => openEditTaskModal(task, event)}
									>
										<h3 class="font-medium">{task.title}</h3>
										{#if task.description}
											<p class="text-sm text-gray-400 mt-1">{task.description}</p>
										{/if}
									<div class="flex items-center justify-between mt-3 gap-2">
										<span class="text-xs bg-white/10 px-2 py-0.5 rounded capitalize whitespace-nowrap">{task.priority}</span>
										{#if task.assignees?.length}
											<div class="flex flex-wrap justify-end gap-1">
												{#each task.assignees as assignee}
													<span class="text-xs bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500 whitespace-nowrap">
														@{assignee.username}
													</span>
												{/each}
											</div>
										{/if}
									</div>
										
										<!-- Show task skills -->
										{#if data.taskSkills && data.taskSkills[task.id] && data.taskSkills[task.id].length > 0}
											<div class="mt-2 flex flex-wrap gap-1">
												{#each data.taskSkills[task.id] as skill}
													<span class="text-xs bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-500">
														{skill.name}
													</span>
												{/each}
											</div>
										{/if}
									</button>
								{/each}
							</div>
						{:else}
							<p class="text-gray-400 text-sm italic">No tasks in progress</p>
						{/if}
					</div>
					
					<!-- Done Column -->
					<div 
						class="border border-white bg-black/30 rounded-lg p-4"
						role="region" aria-label="Done column"
						ondragover={(e) => handleDragOver(e, 'done')}
						ondrop={(e) => handleDrop(e, 'done')}
					>
						<h2 class="text-xl font-bold mb-4 flex items-center justify-between">
							Done
							<span class="text-sm font-normal bg-white/10 px-2 py-1 rounded">
								{data.tasks?.done?.length || 0}
							</span>
						</h2>
						
						{#if data.tasks?.done && data.tasks.done.length > 0}
							<div class="space-y-3">
								{#each data.tasks.done as task}
									<button 
										type="button"
										class="w-full text-left bg-black border border-white p-3 cursor-move"
										draggable="true"
										ondragstart={() => handleDragStart(task, 'done')}
										ondragend={handleDragEnd}
										onclick={(event) => openEditTaskModal(task, event)}
									>
										<h3 class="font-medium">{task.title}</h3>
										{#if task.description}
											<p class="text-sm text-gray-400 mt-1">{task.description}</p>
										{/if}
									<div class="flex items-center justify-between mt-3 gap-2">
										<span class="text-xs bg-white/10 px-2 py-0.5 rounded capitalize whitespace-nowrap">{task.priority}</span>
										{#if task.assignees?.length}
											<div class="flex flex-wrap justify-end gap-1">
												{#each task.assignees as assignee}
													<span class="text-xs bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500 whitespace-nowrap">
														@{assignee.username}
													</span>
												{/each}
											</div>
										{/if}
									</div>
										
										<!-- Show task skills -->
										{#if data.taskSkills && data.taskSkills[task.id] && data.taskSkills[task.id].length > 0}
											<div class="mt-2 flex flex-wrap gap-1">
												{#each data.taskSkills[task.id] as skill}
													<span class="text-xs bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-500">
														{skill.name}
													</span>
												{/each}
											</div>
										{/if}
									</button>
								{/each}
							</div>
						{:else}
							<p class="text-gray-400 text-sm italic">No completed tasks</p>
						{/if}
					</div>
				</div>
				
				<!-- Hidden form for task status updates -->
				<form id="updateTaskForm" method="post" action="?/updateTaskStatus" use:enhance class="hidden">
					<input id="updateTaskId" name="taskId" type="hidden" />
					<input id="updateTaskStatus" name="status" type="hidden" />
				</form>
			</div>
		{/if}

		<!-- Visualization Tab -->
		{#if activeTab === 'visualization'}
			<div transition:fade={{ duration: 150 }}>
				<div class="mb-6">
					<h2 class="text-xl font-semibold mb-4">Sphere Visualization</h2>
					<p class="text-gray-300 mb-6">
						This visualization shows the relationships between tasks, skills, and team members in your organization.
					</p>
					
					<!-- Sphere Visualization Component -->
					<div class="border border-white bg-black p-4 rounded-lg">
						<SphereVisualization 
								tasks={data.tasks || {}}
								skills={data.skills || []}
								users={data.members || []}
								taskSkills={data.taskSkills || {}}
								userSkills={{...(
									data.userSkills ? Object.fromEntries(
										data.members.map(member => {
											const userId = member.userId;
											const userSkills = data.userSkills?.[userId] || [];
											return [
												userId, 
												{
													id: userId,
													username: member.username,
													skills: userSkills.map(skill => ({ 
														id: skill.id, 
														name: skill.name, 
														proficiency: skill.proficiency
													}))
												}
											]
										})
									) : {}
								)}}
								height="700px"
							/>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Invite Member Modal -->
{#if showInviteModal}
	<div
		role="button"
		tabindex="0"
		class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeInviteModal();
		}}
		onkeydown={(event) => handleOverlayKeyDown(event, closeInviteModal)}
	>
		<div
			role="dialog"
			aria-modal="true"
			tabindex="0"
			class="bg-black border-2 border-white shadow-xl.max-w-md w-full max-h-[85vh] flex flex-col"
			onkeydown={(event) => event.stopPropagation()}
		>
			<form
				method="post"
				action="?/inviteMember"
				use:enhance={({ formData, cancel }) => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							inviteMessage = `${formData.get('username')} has been invited successfully!`;
							inviteError = '';
							inviteUsername = '';
							await update();
						} else if (result.type === 'failure') {
							inviteError = typeof result.data?.error === 'string' ? result.data.error : 'Failed to invite user';
							inviteMessage = '';
						}
					};
				}}
				class="flex flex-col h-full overflow-hidden"
			>
				<header class="px-8 pt-8">
					<h2 class="text-xl font-bold text-white">Invite Member</h2>
				</header>

				<div class="flex-1 overflow-y-auto px-8 pb-4 space-y-4">
					{#if inviteMessage}
						<div class="p-3 bg-green-900/50 border border-green-600 text-green-100 text-sm">
							{inviteMessage}
						</div>
					{/if}

					{#if inviteError}
						<div class="p-3 bg-red-900/50 border border-red-600 text-red-100 text-sm">
							{inviteError}
						</div>
					{/if}

					<div>
						<label for="username" class="block text-sm font-medium text-white mb-1">Username</label>
						<input
							id="username"
							name="username"
							type="text"
							bind:value={inviteUsername}
							required
							class="w-full border border-white bg-black px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
							placeholder="Enter username to invite"
						/>
					</div>
				</div>

				<footer class="px-8 pb-8 pt-4 border-t border-white/30 flex gap-4">
					<button 
						type="button"
						onclick={closeInviteModal}
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
				</footer>
			</form>
		</div>
	</div>
{/if}

<!-- Leave Organization Confirmation Modal -->
{#if showLeaveConfirmation}
	<div
		role="button"
		tabindex="0"
		class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeLeaveConfirmation();
		}}
		onkeydown={(event) => handleOverlayKeyDown(event, closeLeaveConfirmation)}
	>
		<div
			role="dialog"
			aria-modal="true"
			tabindex="0"
			class="bg-black border-2 border-white shadow-xl max-w-md w-full max-h-[85vh] flex flex-col"
			onkeydown={(event) => event.stopPropagation()}
		>
			<header class="px-8 pt-8">
				<h2 class="text-xl font-bold text-white">Leave Organization</h2>
			</header>

			<div class="flex-1 overflow-y-auto px-8 pb-4">
				<p class="text-white">
					Are you sure you want to leave this organization? You will lose access to all its resources.
				</p>
			</div>

			<footer class="px-8 pb-8 pt-4 border-t border-white/30 flex gap-4">
				<button 
					type="button"
					onclick={closeLeaveConfirmation}
					class="flex-1 px-4 py-2 bg-black text-white border-2 border-white hover:bg-white/10 transition-colors duration-200"
				>
					Cancel
				</button>
				<form method="post" action="?/leaveOrganization" use:enhance={enhanceLeaveOrganization} class="flex-1">
					<button 
						type="submit"
						class="w-full px-4 py-2 bg-red-500 text-white border-2 border-red-500 hover:bg-red-600 transition-colors duration-200"
					>
						Leave
					</button>
				</form>
			</footer>
		</div>
	</div>
{/if}

<!-- Delete Organization Modal -->
{#if showDeleteOrganizationModal}
	<div
		role="button"
		tabindex="0"
		class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeDeleteOrganizationModal();
		}}
		onkeydown={(event) => handleOverlayKeyDown(event, closeDeleteOrganizationModal)}
	>
		<div
			role="dialog"
			aria-modal="true"
			tabindex="0"
			class="bg-black border-2 border-white shadow-xl max-w-md w-full max-h-[85vh] flex flex-col"
			onkeydown={(event) => event.stopPropagation()}
		>
			<header class="px-8 pt-8">
				<h2 class="text-xl font-bold text-white">Delete Organization</h2>
			</header>

			<div class="flex-1 overflow-y-auto px-8 pb-4 space-y-4">
				<p class="text-white">
					This action will permanently remove <span class="font-semibold">{data.organization.name}</span>, including all tasks and memberships.
				</p>
				<p class="text-sm text-red-300">This cannot be undone.</p>
			</div>

			<footer class="px-8 pb-8 pt-4 border-t border-white/30 flex gap-4">
				<button 
					type="button"
					onclick={closeDeleteOrganizationModal}
					class="flex-1 px-4 py-2 bg-black text-white border-2 border-white hover:bg-white/10 transition-colors duration-200"
				>
					Cancel
				</button>
				<form method="post" action="?/deleteOrganization" use:enhance={enhanceDeleteOrganization} class="flex-1">
					<button 
						type="submit"
						class="w-full px-4 py-2 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 transition-colors duration-200"
					>
						Delete Organization
					</button>
				</form>
			</footer>
		</div>
	</div>
{/if}

<!-- Create Task Modal -->
{#if showCreateTaskModal}
	<div
		role="button"
		tabindex="0"
		class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeCreateTaskModal();
		}}
		onkeydown={(event) => handleOverlayKeyDown(event, closeCreateTaskModal)}
	>
		<div
			role="dialog"
			aria-modal="true"
			tabindex="0"
			class="bg-black border-2 border-white shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
			onkeydown={(event) => event.stopPropagation()}
		>
			<form
				method="post"
				action="?/createTask"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							await update();
							closeCreateTaskModal();
						}
					};
				}}
				class="flex flex-col h-full overflow-hidden"
			>
				<header class="px-8 pt-8">
					<h2 class="text-xl font-bold text-white">Create New Task</h2>
				</header>

				<div class="flex-1 overflow-y-auto px-8 pb-4 space-y-4">
					<div>
						<label for="title" class="block text-sm font-medium text-white mb-1">Task Title</label>
						<input
							id="title"
							name="title"
							type="text"
							bind:value={taskTitle}
							required
							class="w-full border border-white bg-black px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
							placeholder="Enter task title"
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-white mb-1">Description (optional)</label>
						<textarea
							id="description"
							name="description"
							bind:value={taskDescription}
							rows="3"
							class="w-full border border-white bg-black px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
							placeholder="Describe the task"
						></textarea>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="status" class="block text-sm font-medium text-white mb-1">Status</label>
							<select
								id="status"
								name="status"
								bind:value={taskStatus}
								class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
							>
								<option value="backlog">Backlog</option>
								<option value="todo">To Do</option>
								<option value="in-progress">In Progress</option>
								<option value="done">Done</option>
							</select>
						</div>

						<div>
							<label for="priority" class="block text-sm font-medium text-white mb-1">Priority</label>
							<select
								id="priority"
								name="priority"
								bind:value={taskPriority}
								class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
							>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>
						</div>
					</div>

					<div>
						<label for="assignedToIds" class="block text-sm font-medium text-white mb-1">Assign To (optional)</label>
						<select
							id="assignedToIds"
							name="assignedToIds"
							multiple
							bind:value={assignedUserIds}
							class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white h-32"
						>
							{#each data.members as member}
								<option value={member.userId}>{member.username}</option>
							{/each}
						</select>
						<p class="mt-2 text-xs text-gray-400">Hold Ctrl/⌘ to select multiple teammates. Leave empty for no assignees.</p>
					</div>

					<div>
						<label for="skillSearch" class="block text-sm font-medium text-white mb-1">Required Skills</label>
						<input
							id="skillSearch"
							type="text"
							bind:value={skillSearchTerm}
							oninput={filterSkills}
							placeholder="Search for skills..."
							class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white mb-2"
						/>
						<div class="border border-white/30 p-2 mb-2 max-h-32 overflow-y-auto">
							{#if filteredSkills.length > 0}
								<div class="space-y-1">
									{#each filteredSkills as skill}
										<button 
											type="button"
											class="w-full text-left p-2 flex justify-between items-center hover:bg-white/10 {selectedSkillIds.includes(skill.id) ? 'bg-white/10 border-l-4 border-green-500' : ''}"
											onclick={() => toggleSkillSelection(skill.id)}
										>
											<div>
												<span class="font-medium">{skill.name}</span>
												{#if skill.category}
													<span class="ml-2 text-xs bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500">{skill.category}</span>
												{/if}
											</div>
											{#if selectedSkillIds.includes(skill.id)}
												<span class="text-green-500">✓</span>
											{/if}
										</button>
								{/each}
							</div>
						{:else}
							<p class="text-gray-500 italic text-sm p-2">No skills found</p>
						{/if}
						</div>

						<div class="flex flex-wrap gap-2">
							{#each createSelectedSkills as skill}
								<div class="bg-purple-900/50 px-2 py-1 rounded flex items-center border border-purple-500 text-sm">
									<span>{skill.name}</span>
									<button
										type="button"
										class="ml-2 text-purple-300 hover:text-white"
										onclick={() => toggleSkillSelection(skill.id)}
									>×</button>
								</div>
							{/each}
						</div>

						{#each selectedSkillIds as skillId}
							<input type="hidden" name="skillIds" value={skillId} />
						{/each}
					</div>
				</div>

				<input type="hidden" name="organizationId" value={data.organization.id} />

				<footer class="px-8 pb-8 pt-4 border-t border-white/30 flex gap-4">
					<button 
						type="button"
						onclick={closeCreateTaskModal}
						class="flex-1 px-4 py-2 bg-black text-white border-2 border-white hover:bg-white/10 transition-colors duration-200"
					>
						Cancel
					</button>
					<button 
						type="submit"
						class="flex-1 px-4 py-2 bg-white text-black border-2 border-white hover:bg-white/90 transition-colors duration-200"
					>
						Create Task
					</button>
				</footer>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Task Modal -->
{#if showEditTaskModal && editingTaskId !== null}
	<div
		role="button"
		tabindex="0"
		class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeEditTaskModal();
		}}
		onkeydown={(event) => handleOverlayKeyDown(event, closeEditTaskModal)}
	>
		<div
			role="dialog"
			aria-modal="true"
			tabindex="0"
			class="bg-black border-2 border-white shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
	onkeydown={(event) => event.stopPropagation()}
	>
			<form method="post" action="?/updateTask" use:enhance={enhanceUpdateTask} class="flex flex-col h-full overflow-hidden">
				<input type="hidden" name="taskId" value={editingTaskId} />

				<header class="px-8 pt-8 flex items-start justify-between">
					<h2 class="text-xl font-bold text-white">Edit Task</h2>
					<button type="button" class="text-white hover:text-gray-300" onclick={closeEditTaskModal}>×</button>
				</header>

				<div class="flex-1 overflow-y-auto px-8 pb-4 space-y-4">
					{#if taskEditError}
						<p class="bg-red-900/40 border border-red-500 text-red-100 px-3 py-2 text-sm">{taskEditError}</p>
					{/if}

					<div>
						<label for="edit-title" class="block text-sm font-medium text-white mb-1">Task Title</label>
						<input
							id="edit-title"
							name="title"
							type="text"
							bind:value={editTaskTitle}
							required
							class="w-full border border-white bg-black px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
						/>
					</div>

					<div>
						<label for="edit-description" class="block text-sm font-medium text-white mb-1">Description</label>
						<textarea
							id="edit-description"
							name="description"
							bind:value={editTaskDescription}
							rows="3"
							class="w-full border border-white bg-black px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
						></textarea>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="edit-status" class="block text-sm font-medium text-white mb-1">Status</label>
							<select
								id="edit-status"
								name="status"
								bind:value={editTaskStatus}
								class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
							>
								<option value="backlog">Backlog</option>
								<option value="todo">To Do</option>
								<option value="in-progress">In Progress</option>
								<option value="done">Done</option>
							</select>
						</div>

						<div>
							<label for="edit-priority" class="block text-sm font-medium text-white mb-1">Priority</label>
							<select
								id="edit-priority"
								name="priority"
								bind:value={editTaskPriority}
								class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
							>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>
						</div>
					</div>

					<div>
						<label for="edit-assignedToIds" class="block text-sm font-medium text-white mb-1">Assigned Members</label>
						<select
							id="edit-assignedToIds"
							name="assignedToIds"
							multiple
							bind:value={editAssignedUserIds}
							class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white h-32"
						>
							{#each data.members as member}
								<option value={member.userId}>{member.username}</option>
							{/each}
						</select>
						<p class="mt-2 text-xs text-gray-400">Hold Ctrl/⌘ to modify multiple assignees. Leave empty for no direct owner.</p>
					</div>

					<div>
						<label for="editSkillSearch" class="block text-sm font-medium text-white mb-1">Required Skills</label>
						<input
							id="editSkillSearch"
							type="text"
							bind:value={editSkillSearchTerm}
							oninput={filterEditSkills}
							placeholder="Search for skills..."
							class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white mb-2"
						/>
						<div class="border border-white/30 p-2 mb-2 max-h-32 overflow-y-auto">
							{#if editFilteredSkills.length > 0}
								<div class="space-y-1">
									{#each editFilteredSkills as skill}
										<button
											type="button"
											class="w-full text-left p-2 flex justify-between items-center hover:bg-white/10 {editSkillIds.includes(skill.id) ? 'bg-white/10 border-l-4 border-green-500' : ''}"
											onclick={() => toggleEditSkillSelection(skill.id)}
										>
											<span class="font-medium">{skill.name}</span>
											{#if editSkillIds.includes(skill.id)}
												<span class="text-green-500">✓</span>
											{/if}
										</button>
									{/each}
								</div>
							{:else}
								<p class="text-gray-500 italic text-sm p-2">No skills found</p>
							{/if}
						</div>

						<div class="flex flex-wrap gap-2">
							{#each editSelectedSkills as skill}
								<div class="bg-purple-900/50 px-2 py-1 rounded flex items-center border border-purple-500 text-sm">
									<span>{skill.name}</span>
									<button
										type="button"
										class="ml-2 text-purple-300 hover:text-white"
										onclick={() => toggleEditSkillSelection(skill.id)}
									>×</button>
								</div>
							{/each}
						</div>

						{#each editSkillIds as skillId}
							<input type="hidden" name="skillIds" value={skillId} />
						{/each}
					</div>
				</div>

				<footer class="px-8 pb-8 pt-4 border-t border-white/30 flex gap-4">
					<button
						type="button"
						onclick={closeEditTaskModal}
						class="flex-1 px-4 py-2 bg-black text-white border-2 border-white hover:bg-white/10 transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="flex-1 px-4 py-2 bg-white text-black border-2 border-white hover:bg-white/90 transition-colors"
					>
						Save Changes
					</button>
				</footer>
			</form>
		</div>
	</div>
{/if}
