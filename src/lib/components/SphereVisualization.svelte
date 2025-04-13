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
    export const users: any[] = [];
    export let taskSkills: Record<number, {id: number, name: string}[]> = {};
    export let userSkills: Record<string, {id: string, username: string, skills: {id: number, name: string, proficiency?: number}[]}> = {};
    export let height: string = '600px';
    export let width: string = '100%';

    // Internal state
    let container: HTMLElement;
    let network: any;
    let selectedNode: any = null;
    let infoVisible = false;

    // Create the graph data structure
    function createGraphData() {
        // Create node datasets
        const nodes = new DataSet<Node>();
        const edges = new DataSet<Edge>();
        
        // Add task nodes
        const allTasks = [
            ...(tasks.backlog || []), 
            ...(tasks.todo || []), 
            ...(tasks['in-progress'] || []), 
            ...(tasks.done || [])
        ];
        
        allTasks.forEach(task => {
            nodes.add({
                id: `task-${task.id}`,
                label: truncateLabel(task.title),
                title: task.description ? `${task.title}\n\n${task.description}` : task.title,
                group: 'task',
                shape: 'box',
                font: { color: '#ffffff' },
                color: {
                    background: getPriorityColor(task.priority),
                    border: '#ffffff',
                    highlight: { background: '#ffffff', border: '#000000' }
                }
            });

            // Add task-skill edges
            if (taskSkills[task.id]) {
                taskSkills[task.id].forEach(skill => {
                    // Add skill node if it doesn't exist yet
                    if (!nodes.get(`skill-${skill.id}`)) {
                        nodes.add({
                            id: `skill-${skill.id}`,
                            label: skill.name,
                            group: 'skill',
                            shape: 'hexagon',
                            color: { 
                                background: '#7c3aed',
                                border: '#ffffff',
                                highlight: { background: '#9f5afd', border: '#ffffff' }
                            },
                            font: { color: '#ffffff' }
                        });
                    }

                    // Add edge
                    edges.add({
                        from: `task-${task.id}`,
                        to: `skill-${skill.id}`,
                        arrows: 'to',
                        color: { color: '#7c3aed', opacity: 0.6 },
                    });
                });
            }

            // Add task-user edges
            if (task.assignedToId) {
                edges.add({
                    from: `task-${task.id}`,
                    to: `user-${task.assignedToId}`,
                    arrows: 'to',
                    dashes: true,
                    color: { color: '#ffffff', opacity: 0.8 },
                    label: 'assigned to'
                });
            }
        });

        // Add user nodes
        Object.values(userSkills).forEach(user => {
            nodes.add({
                id: `user-${user.id}`,
                label: user.username,
                group: 'user',
                shape: 'circularImage',
                image: getAvatarUrl(user.username),
                size: 30,
                borderWidth: 2,
                color: {
                    border: '#ffffff',
                    background: '#18181b',
                    highlight: { background: '#4ade80', border: '#ffffff' }
                },
                font: { color: '#ffffff', size: 14, face: 'Arial' }
            });

            // Add user-skill edges
            user.skills.forEach(skill => {
                // Add skill node if it doesn't exist yet
                if (!nodes.get(`skill-${skill.id}`)) {
                    nodes.add({
                        id: `skill-${skill.id}`,
                        label: skill.name,
                        group: 'skill',
                        shape: 'hexagon',
                        color: { 
                            background: '#7c3aed',
                            border: '#ffffff',
                            highlight: { background: '#9f5afd', border: '#ffffff' }
                        },
                        font: { color: '#ffffff' }
                    });
                }

                // Add edge with width based on proficiency
                const proficiency = skill.proficiency || 1;
                edges.add({
                    from: `user-${user.id}`,
                    to: `skill-${skill.id}`,
                    color: { color: '#4ade80', opacity: 0.6 },
                    width: proficiency, // Width based on proficiency
                    title: `Proficiency: ${getProficiencyDisplay(proficiency)}`
                });
            });
        });

        return { nodes, edges };
    }

    // Get a color based on task priority
    function getPriorityColor(priority: string): string {
        switch (priority?.toLowerCase()) {
            case 'high':
                return '#ef4444';  // Red
            case 'medium':
                return '#f59e0b';  // Amber
            case 'low':
                return '#10b981';  // Green
            default:
                return '#6366f1';  // Indigo
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

    // Handle node click
    function handleNodeClick(params: any) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            selectedNode = {
                id: nodeId,
                type: nodeId.split('-')[0],
                data: getNodeData(nodeId)
            };
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
                return allTasks.find(task => task.id.toString() === id);
            }
            case 'skill':
                return skills.find(skill => skill.id.toString() === id);
            case 'user':
                return userSkills[id];
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
    <div class="visualization-container" bind:this={container} style:height={height} style:width={width}></div>
    
    {#if infoVisible && selectedNode}
        <div class="node-info border border-white bg-black/70 backdrop-blur-sm p-4 shadow-lg rounded-md">
            <!-- Close button -->
            <button class="close-btn absolute top-2 right-2 text-white hover:text-gray-300" on:click={() => infoVisible = false}>✕</button>
            
            <!-- Task info -->
            {#if selectedNode.type === 'task'}
                <div class="info-content text-white">
                    <h3 class="text-xl font-bold mb-2">{selectedNode.data.title}</h3>
                    {#if selectedNode.data.description}
                        <p class="text-gray-300 mb-3">{selectedNode.data.description}</p>
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
                            <span>{selectedNode.data.createdBy}</span>
                        </div>
                        {#if selectedNode.data.assignedToUsername}
                            <div>
                                <span class="text-gray-400">Assigned to:</span>
                                <span>{selectedNode.data.assignedToUsername}</span>
                            </div>
                        {/if}
                    </div>
                    {#if taskSkills[selectedNode.data.id]}
                        <div class="mt-4">
                            <h4 class="text-gray-300 font-medium mb-1">Required Skills:</h4>
                            <div class="flex flex-wrap gap-2">
                                {#each taskSkills[selectedNode.data.id] as skill}
                                    <span class="bg-purple-900/50 text-xs px-2 py-1 rounded border border-purple-500">
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
                    <div class="flex items-center mb-4">
                        <img 
                            src={getAvatarUrl(selectedNode.data.username)} 
                            alt={selectedNode.data.username} 
                            class="w-16 h-16 rounded-full mr-4 border-2 border-white"
                        />
                        <h3 class="text-xl font-bold">{selectedNode.data.username}</h3>
                    </div>
                    
                    {#if selectedNode.data.skills && selectedNode.data.skills.length > 0}
                        <div>
                            <h4 class="text-gray-300 font-medium mb-1">Skills:</h4>
                            <div class="flex flex-wrap gap-2">
                                {#each selectedNode.data.skills as skill}
                                    <span class="bg-green-900/50 text-xs px-2 py-1 rounded border border-green-500 flex items-center">
                                        <span>{skill.name}</span>
                                        {#if skill.proficiency}
                                            <span class="ml-1 px-1 py-0.5 text-xs rounded bg-green-700/50 border border-green-400">
                                                {getProficiencyDisplay(skill.proficiency)}
                                            </span>
                                        {/if}
                                    </span>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            
            <!-- Skill info -->
            {:else if selectedNode.type === 'skill'}
                <div class="info-content text-white">
                    <h3 class="text-xl font-bold mb-4">{selectedNode.data.name}</h3>
                    
                    <!-- Find tasks requiring this skill -->
                    <div class="mb-4">
                        <h4 class="text-gray-300 font-medium mb-1">Tasks requiring this skill:</h4>
                        <div class="space-y-2">
                            {#each Object.entries(taskSkills) as [taskId, skills]}
                                {#if skills.some(s => s.id === parseInt(selectedNode.data.id))}
                                    {#if processedTasks.find(t => t.id === parseInt(taskId))}
                                        <div class="border border-purple-500/30 bg-purple-900/20 p-2 rounded text-sm">
                                            {processedTasks.find(t => t.id === parseInt(taskId)).title}
                                        </div>
                                    {/if}
                                {/if}
                            {/each}
                        </div>
                    </div>
                    
                    <!-- Find users with this skill -->
                    <div>
                        <h4 class="text-gray-300 font-medium mb-1">Users with this skill:</h4>
                        <div class="space-y-2">
                            {#each Object.values(userSkills) as user}
                                {#if user.skills.some(s => s.id === parseInt(selectedNode.data.id))}
                                    <div class="border border-green-500/30 bg-green-900/20 p-2 rounded text-sm flex items-center">
                                        <img 
                                            src={getAvatarUrl(user.username)} 
                                            alt={user.username} 
                                            class="w-6 h-6 rounded-full mr-2"
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
