<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import { fly, fade } from 'svelte/transition';

	let { data }: { data: PageServerData } = $props();
	
	// Active tab state
	let activeTab = $state('about');
	
	// State for member invitation modal
	let showInviteModal = $state(false);
	let inviteUsername = $state('');
	let inviteMessage = $state('');
	let inviteError = $state('');
	
	// State for leave organization confirmation modal
	let showLeaveConfirmation = $state(false);
	
	// State for create task modal
	let showCreateTaskModal = $state(false);
	let taskTitle = $state('');
	let taskDescription = $state('');
	let taskStatus = $state('backlog');
	let taskPriority = $state('medium');
	let assignedUserId = $state('');
	
	// Toggle modals
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
	
	function toggleCreateTaskModal() {
		showCreateTaskModal = !showCreateTaskModal;
		if (showCreateTaskModal) {
			// Reset form fields
			taskTitle = '';
			taskDescription = '';
			taskStatus = 'backlog';
			taskPriority = 'medium';
			assignedUserId = '';
		}
	}
	
	// Format date
	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	
	// State for drag and drop
	let draggedTask: any = null;
	let draggedColumn: string = '';
	let dragOverColumn: string = '';
	
	// Handle drag start
	function handleDragStart(task: any, column: string) {
		draggedTask = task;
		draggedColumn = column;
	}
	
	// Handle drag over
	function handleDragOver(event: DragEvent, column: string) {
		event.preventDefault();
		dragOverColumn = column;
	}
	
	// Handle drop
	function handleDrop(event: DragEvent, column: string) {
		event.preventDefault();
		
		if (draggedTask && draggedColumn !== column) {
			// Submit form to update task status
			const form = document.getElementById('updateTaskForm') as HTMLFormElement;
			const taskIdInput = document.getElementById('updateTaskId') as HTMLInputElement;
			const statusInput = document.getElementById('updateTaskStatus') as HTMLInputElement;
			
			taskIdInput.value = draggedTask.id.toString();
			statusInput.value = column;
			
			form.requestSubmit();
		}
	}
	
	// Get task suggestion based on current tasks
	function getTaskSuggestion() {
		const suggestions = [
			"Consider breaking down larger tasks into smaller ones for better tracking",
			"Tasks with no recent activity might need attention",
			"Balancing task distribution among team members improves efficiency",
			"Regular updates help keep everyone informed of progress",
			"Adding skills to tasks helps match the right people to the right work"
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
									<div 
										class="bg-black border border-white p-3 cursor-move"
										draggable="true"
										ondragstart={() => handleDragStart(task, 'backlog')}
										role="listitem"
									>
										<h3 class="font-medium">{task.title}</h3>
										{#if task.description}
											<p class="text-sm text-gray-400 mt-1">{task.description}</p>
										{/if}
										<div class="flex items-center justify-between mt-3">
											<span class="text-xs bg-white/10 px-2 py-0.5 rounded capitalize">{task.priority}</span>
											{#if task.assignedToUsername}
												<span class="text-xs bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500">
													@{task.assignedToUsername}
												</span>
											{/if}
										</div>
									</div>
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
									<div 
										class="bg-black border border-white p-3 cursor-move"
										draggable="true"
										ondragstart={() => handleDragStart(task, 'todo')}
										role="listitem"
									>
										<h3 class="font-medium">{task.title}</h3>
										{#if task.description}
											<p class="text-sm text-gray-400 mt-1">{task.description}</p>
										{/if}
										<div class="flex items-center justify-between mt-3">
											<span class="text-xs bg-white/10 px-2 py-0.5 rounded capitalize">{task.priority}</span>
											{#if task.assignedToUsername}
												<span class="text-xs bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500">
													@{task.assignedToUsername}
												</span>
											{/if}
										</div>
									</div>
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
									<div 
										class="bg-black border border-white p-3 cursor-move"
										draggable="true"
										ondragstart={() => handleDragStart(task, 'in-progress')}
										role="listitem"
									>
										<h3 class="font-medium">{task.title}</h3>
										{#if task.description}
											<p class="text-sm text-gray-400 mt-1">{task.description}</p>
										{/if}
										<div class="flex items-center justify-between mt-3">
											<span class="text-xs bg-white/10 px-2 py-0.5 rounded capitalize">{task.priority}</span>
											{#if task.assignedToUsername}
												<span class="text-xs bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500">
													@{task.assignedToUsername}
												</span>
											{/if}
										</div>
									</div>
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
									<div 
										class="bg-black border border-white p-3 cursor-move"
										draggable="true"
										ondragstart={() => handleDragStart(task, 'done')}
										role="listitem"
									>
										<h3 class="font-medium">{task.title}</h3>
										{#if task.description}
											<p class="text-sm text-gray-400 mt-1">{task.description}</p>
										{/if}
										<div class="flex items-center justify-between mt-3">
											<span class="text-xs bg-white/10 px-2 py-0.5 rounded capitalize">{task.priority}</span>
											{#if task.assignedToUsername}
												<span class="text-xs bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500">
													@{task.assignedToUsername}
												</span>
											{/if}
										</div>
									</div>
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
	</div>
</div>

<!-- Invite Member Modal -->
{#if showInviteModal}
	<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
		<div class="bg-black p-8 shadow-xl border-2 border-white max-w-md w-full">
			<h2 class="text-xl font-bold text-white mb-4">Invite Member</h2>
			
			{#if inviteMessage}
				<div class="mb-4 p-3 bg-green-900/50 border border-green-600 text-green-100">
					{inviteMessage}
				</div>
			{/if}
			
			{#if inviteError}
				<div class="mb-4 p-3 bg-red-900/50 border border-red-600 text-red-100">
					{inviteError}
				</div>
			{/if}
			
			<form method="post" action="?/inviteMember" use:enhance={({ formData, cancel }) => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						inviteMessage = `${formData.get('username')} has been invited successfully!`;
						inviteError = '';
						
						// Clear the username field
						inviteUsername = '';
						
						// Update the page to reflect the server response
						await update();
					} else if (result.type === 'failure') {
						inviteError = typeof result.data?.error === 'string' ? result.data.error : 'Failed to invite user';
						inviteMessage = '';
					}
				};
			}}>
				<div class="mb-4">
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

<!-- Create Task Modal -->
{#if showCreateTaskModal}
	<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
		<div class="bg-black p-8 shadow-xl border-2 border-white max-w-md w-full">
			<h2 class="text-xl font-bold text-white mb-4">Create New Task</h2>
			
			<form method="post" action="?/createTask" use:enhance>
				<div class="mb-4">
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
				
				<div class="mb-4">
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
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
				
				 <!-- Assignee dropdown -->
				<div class="mb-4">
					<label for="assignedToId" class="block text-sm font-medium text-white mb-1">Assign To (optional)</label>
					<select
						id="assignedToId"
						name="assignedToId"
						bind:value={assignedUserId}
						class="w-full border border-white bg-black px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
					>
						<option value="">Unassigned</option>
						{#each data.members as member}
							<option value={member.userId}>{member.username}</option>
						{/each}
					</select>
				</div>
				
				<!-- Hidden organization ID field -->
				<input type="hidden" name="organizationId" value={data.organization.id} />
				
				<div class="flex space-x-4 mt-6">
					<button 
						type="button"
						onclick={toggleCreateTaskModal}
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
				</div>
			</form>
		</div>
	</div>
{/if}
