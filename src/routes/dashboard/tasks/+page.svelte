<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	
	let { data } = $props<{ data: PageServerData }>();
	
	// State for create task modal
	let showCreateModal = $state(false);
	let taskTitle = $state('');
	let taskDescription = $state('');
	let taskStatus = $state('backlog');
	let taskPriority = $state('medium');
	let taskOrganizationId = $state<number | null>(null);
	
	// Toggle create task modal
	function toggleCreateModal() {
		showCreateModal = !showCreateModal;
		if (showCreateModal) {
			// Reset form fields
			taskTitle = '';
			taskDescription = '';
			taskStatus = 'backlog';
			taskPriority = 'medium';
			taskOrganizationId = null;
		}
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
		
		// Reset drag state
		draggedTask = null;
		draggedColumn = '';
		dragOverColumn = '';
	}
	
	// Function to get display text for priority level
	function getPriorityDisplay(priority: string): string {
		switch (priority) {
			case 'high':
				return 'High';
			case 'medium':
				return 'Medium';
			case 'low':
				return 'Low';
			default:
				return 'Medium';
		}
	}
	
	// Function to get css class for priority level
	function getPriorityClass(priority: string): string {
		switch (priority) {
			case 'high':
				return 'bg-red-500';
			case 'medium':
				return 'bg-yellow-500';
			case 'low':
				return 'bg-green-500';
			default:
				return 'bg-yellow-500';
		}
	}
	
	// AI-enhanced task suggestions (will be expanded in future)
	function getTaskSuggestion() {
		return "Try adding more specific details to your task description for better matching with team skills.";
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-6 flex justify-between items-center">
		<h1 class="text-3xl font-bold">Task Board</h1>
		<button 
			onclick={toggleCreateModal}
			class="border-2 border-white bg-black px-4 py-2 font-medium text-white hover:bg-white hover:text-black transition-colors duration-200"
		>
			Create New Task
		</button>
	</div>
	
	<!-- AI Insight Banner - Simple version to be expanded -->
	<div class="mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-lg">
		<div class="flex items-center">
			<div class="mr-3">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			<div>
				<p class="text-white font-medium">AI Insight</p>
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
					{#each data.tasks.backlog as task (task.id)}
						<div 
							class="border border-white bg-black p-3 rounded cursor-move"
							role="button" aria-grabbed="false"
							tabindex="0"
							draggable="true"
							ondragstart={() => handleDragStart(task, 'backlog')}
							transition:fly={{ y: 10, duration: 200 }}
						>
							<div class="flex justify-between items-start mb-2">
								<h3 class="font-medium">{task.title}</h3>
								<span class="text-xs {getPriorityClass(task.priority)} text-black px-2 py-0.5 rounded">
									{getPriorityDisplay(task.priority)}
								</span>
							</div>
							{#if task.description}
								<p class="text-sm text-gray-300 mb-2">{task.description}</p>
							{/if}
							<div class="mt-2 flex flex-wrap gap-1">
								{#if data.taskSkills && data.taskSkills[task.id]}
									{#each data.taskSkills[task.id] as skill}
										<span class="bg-purple-900/50 text-xs px-2 py-1 rounded border border-purple-500">
											{skill.name}
										</span>
									{/each}
								{/if}
							</div>
							<div class="mt-2 text-xs text-gray-400 flex justify-between">
								<span>Created by: {task.createdBy}</span>
								{#if task.orgName}
									<span>Org: {task.orgName}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center text-gray-500 italic py-4">No tasks in backlog</div>
			{/if}
		</div>
		
		<!-- Todo Column -->
		<div 
			class="border border-white bg-black/30 rounded-lg p-4"
			role="region" aria-label="To Do column"
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
					{#each data.tasks.todo as task (task.id)}
						<div 
							class="border border-white bg-black p-3 rounded cursor-move"
							role="button" aria-grabbed="false"
							draggable="true"
							ondragstart={() => handleDragStart(task, 'todo')}
							transition:fly={{ y: 10, duration: 200 }}
							tabindex="0"
						>
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-medium">{task.title}</h3>
                                <span class="text-xs {getPriorityClass(task.priority)} text-black px-2 py-0.5 rounded">
                                    {getPriorityDisplay(task.priority)}
                                </span>
                            </div>
                            {#if task.description}
                                <p class="text-sm text-gray-300 mb-2">{task.description}</p>
                            {/if}
                            <div class="mt-2 flex flex-wrap gap-1">
                                {#if data.taskSkills && data.taskSkills[task.id]}
                                    {#each data.taskSkills[task.id] as skill}
                                        <span class="bg-purple-900/50 text-xs px-2 py-1 rounded border border-purple-500">
                                            {skill.name}
                                        </span>
                                    {/each}
                                {/if}
                            </div>
                            <div class="mt-2 text-xs text-gray-400 flex justify-between">
                                <span>Created by: {task.createdBy}</span>
                                {#if task.orgName}
                                    <span>Org: {task.orgName}</span>
                                {/if}
                            </div>
                        </div>
					{/each}
				</div>
			{:else}
				<div class="text-center text-gray-500 italic py-4">No tasks to do</div>
			{/if}
		</div>
		
		<!-- In Progress Column -->
		<div 
			class="border border-white bg-black/30 rounded-lg p-4"
			role="region" aria-label="In Progress column"
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
					{#each data.tasks['in-progress'] as task (task.id)}
						<div 
							class="border border-white bg-black p-3 rounded cursor-move"
							role="button" aria-grabbed="false"
							draggable="true"
							ondragstart={(e) => handleDragStart(task, 'in-progress')}
							transition:fly={{ y: 10, duration: 200 }}
						>
							<div class="flex justify-between items-start mb-2">
								<h3 class="font-medium">{task.title}</h3>
								<span class="text-xs {getPriorityClass(task.priority)} text-black px-2 py-0.5 rounded">
									{getPriorityDisplay(task.priority)}
								</span>
							</div>
							{#if task.description}
								<p class="text-sm text-gray-300 mb-2">{task.description}</p>
							{/if}
							<div class="mt-2 flex flex-wrap gap-1">
								{#if data.taskSkills && data.taskSkills[task.id]}
									{#each data.taskSkills[task.id] as skill}
										<span class="bg-purple-900/50 text-xs px-2 py-1 rounded border border-purple-500">
											{skill.name}
										</span>
									{/each}
								{/if}
							</div>
							<div class="mt-2 text-xs text-gray-400 flex justify-between">
								<span>Created by: {task.createdBy}</span>
								{#if task.orgName}
									<span>Org: {task.orgName}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center text-gray-500 italic py-4">No tasks in progress</div>
			{/if}
		</div>
		
		<!-- Done Column -->
		<div 
			class="border border-white bg-black/30 rounded-lg p-4"
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
					{#each data.tasks.done as task (task.id)}
						<div 
							class="border border-white bg-black p-3 rounded cursor-move opacity-80"
							draggable="true"
							ondragstart={(e) => handleDragStart(task, 'done')}
							transition:fly={{ y: 10, duration: 200 }}
						>
							<div class="flex justify-between items-start mb-2">
									<divDisplay(task.priority)}
								</span>
							</div>
							{#if task.description}
								<p class="text-sm text-gray-300 mb-2">{task.description}</p>
							{/if}
							<div class="mts-2 flex flex-wrap gap-1">
								{#if data.taskSkills && data.taskSkills[task.id]}
									{#each data.task						<div 
							class="border border-white bg-black p-een">
					> handleDragStart(task,			<span 'done')}
							transition:fly>Created by: {task.createdBy}</span>
								{#if task.orgName}
									<span>Org: {task.orgName}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center text-gray-500 italic py-4">No completed tasks</div>
			{/if}
		</div>
	</div>

	<!-- Hidden form for updating tasks -->
	<form 
		id="updateTaskForm" 
		method="post" 
		action="?/updateTaskStatus" 
		use:enhance 
		class="hidden"
	>
		<input id="updateTaskId" name="taskId" type="hidden" />
		<input id="updateTaskStatus" name="status" type="hidden" />
	</form>
</div>

<!-- Create Task Modal -->
{#if showCreateModal}
	<div 
		class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
		transition:fade={{ duration: 200 }}
	>
		<div 
			class="bg-black p-8 shadow-xl border-2 border-white max-w-md w-full rounded-lg"
			transition:fly={{ y: -20, duration: 200 }}
		>
			<h2 class="text-xl font-bold text-white mb-4">Create New Task</h2>
			
			<for class="space-ym metho> handleDragStart(task, 'done')}
							transition:fly={{d="po
							</div>
							{#if task.description}st" action="?/createTask" use:enhance>
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
					<label for="description" class="block text-sm font-medium text-white mb-1">Description</label>
					<textarea
						id="description"
						name="description"
						bind:value={taskDescription}
						rows="3"
						class="w-full border border-white bg-black px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
						placeholder="Describe the task"
					></textarea>
				</div>
				
				<div class="grid grid-cols-2 gap-4 mb-4">
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
				
				<!-- Organization selection will be added in the future -->
				
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
