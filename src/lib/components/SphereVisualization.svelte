<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Network, type Node, type Edge } from 'vis-network';
    import { DataSet } from 'vis-data';

    export let tasks: {
        backlog?: any[];
        todo?: any[];
        'in-progress'?: any[];
        done?: any[];
    } = { backlog: [], todo: [], 'in-progress': [], done: [] };
    export let skills: any[] = [];
    export let users: any[] = [];
    export let taskSkills: Record<number, {id: number, name: string}[]> = {};
    export let userSkills: Record<string, {id: string, username: string, skills: {id: number, name: string, proficiency?: number}[]}> = {};
    export let height: string = '600px';
    export let width: string = '100%';

    let container: HTMLElement;
    let network: any;
    let selectedNode: any = null;
    let infoVisible = false;

    const taskSkillMap: Record<number, number[]> = {};
    const userSkillMap: Record<string, number[]> = {};

    function createGraphData() {
        const nodes = new DataSet<Node>();
        const edges = new DataSet<Edge>();
        
        console.log("Creating sphere visualization with data:", { tasks, users, skills, taskSkills, userSkills });
        
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
                font: { color: '#ffffff', face: 'Arial', size: 14 },
                color: {
                    background: getPriorityColor(task.priority),
                    border: '#ffffff',
                    highlight: { background: '#ffffff', border: '#000000' }
                },
                borderWidth: 2
            });
            
            if (taskSkills[task.id]) {
                taskSkillMap[task.id] = taskSkills[task.id].map(skill => skill.id);
            }
            
            if (task.assignedToId) {
                edges.add({
                    from: `user-${task.assignedToId}`,
                    to: `task-${task.id}`,
                    arrows: 'to',
                    color: { color: '#10b981', opacity: 1.0 },
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
            }
        });
        
        users.forEach(member => {
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
            
            if (userSkills[userId]) {
                userSkillMap[userId] = userSkills[userId].skills.map(skill => skill.id);
            } else {
                userSkillMap[userId] = [];
            }
        });
        
        allTasks.forEach(task => {
            users.forEach(member => {
                const userId = member.userId;
                const username = member.username;
                
                if (task.assignedToId === userId) return;
                
                const taskSkillsList = taskSkills[task.id] || [];
                const taskSkillIds = taskSkillsList.map(skill => Number(skill.id));
                
                if (taskSkillIds.length === 0) return;
                
                const userSkillsObj = userSkills[userId];
                if (!userSkillsObj || !userSkillsObj.skills) return;
                
                const userSkillIds = userSkillsObj.skills.map(skill => Number(skill.id));
                
                if (userSkillIds.length === 0) return;
                
                const matchingSkills: {id: number, name: string}[] = [];
                
                taskSkillsList.forEach(taskSkill => {
                    const taskSkillId = Number(taskSkill.id);
                    
                    if (userSkillIds.includes(taskSkillId)) {
                        matchingSkills.push({
                            id: taskSkillId,
                            name: taskSkill.name
                        });
                    }
                });
                
                if (matchingSkills.length > 0) {
                    const skillNames = matchingSkills.map(skill => skill.name).join(', ');
                    
                    const edgeWidth = Math.min(1 + matchingSkills.length, 8);
                    
                    edges.add({
                        id: `skill-match-${userId}-${task.id}`,
                        from: `user-${userId}`,
                        to: `task-${task.id}`,
                        color: { color: '#FBBF24', opacity: 0.9 },
                        arrows: {
                            to: { enabled: true, scaleFactor: 0.5 }
                        },
                        dashes: [5, 3],
                        width: edgeWidth,
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
                            type: "dynamic",
                            roundness: 0.5
                        }
                    });
                }
            });
        });

        return { nodes, edges };
    }

    function getPriorityColor(priority: string): string {
        switch (priority?.toLowerCase()) {
            case 'high':
                return '#ef4444';
            case 'medium':
                return '#f59e0b';
            case 'low':
                return '#10b981';
            default:
                return '#6366f1';
        }
    }

    function getAvatarUrl(username: string): string {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=128`;
    }

    function truncateLabel(text: string, maxLength: number = 20): string {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
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

    function handleNodeClick(params: any) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const nodeType = nodeId.split('-')[0];
            const nodeData = getNodeData(nodeId);
            
            console.log("Node clicked:", { nodeId, nodeType, nodeData });
            
            selectedNode = {
                id: nodeId,
                type: nodeType,
                data: nodeData
            };
            
            infoVisible = true;
        } else {
            selectedNode = null;
            infoVisible = false;
        }
    }

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
            case 'user': {
                const userSkillData = userSkills[id];
                
                if (userSkillData) {
                    console.log("Found user in userSkills:", userSkillData);
                    return userSkillData;
                } else {
                    console.log("User not found in userSkills, checking users array...");
                    const user = users.find(u => u.userId === id);
                    
                    if (user) {
                        console.log("Found user in users array:", user);
                        return {
                            id: user.userId,
                            username: user.username,
                            skills: []
                        };
                    }
                    
                    console.log("User not found in either source:", id);
                    return null;
                }
            }
            default:
                return null;
        }
    }

    onMount(() => {
        const data = createGraphData();
        
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
        
        network = new Network(container, data, options);
        
        network.on('click', handleNodeClick);
    });

    onDestroy(() => {
        if (network) {
            network.destroy();
            network = null;
        }
    });

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
            <button class="close-btn absolute top-2 right-2 text-white hover:text-gray-300" on:click={() => infoVisible = false}>✕</button>
            
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
                    <div class="mt-4">
                        <h4 class="text-gray-300 font-medium mb-2">Skills:</h4>
                        {#if selectedNode.data?.skills && Array.isArray(selectedNode.data.skills) && selectedNode.data.skills.length > 0}
                            <div class="flex flex-wrap gap-2 mb-4">
                                {#each selectedNode.data.skills as skill}
                                    <span class="bg-green-900/50 text-xs px-2 py-1 rounded border border-green-500 flex items-center">
                                        <span>{skill.name}</span>
                                        {#if skill.proficiency !== undefined && skill.proficiency !== null}
                                            <span class="ml-1 px-1 py-0.5 text-xs rounded bg-green-700/50 border border-green-400">
                                                {getProficiencyDisplay(skill.proficiency)}
                                            </span>
                                        {/if}
                                    </span>
                                {/each}
                            </div>
                        {:else if selectedNode.data?.id && userSkillMap[selectedNode.data.id] && userSkillMap[selectedNode.data.id].length > 0}
                            <div class="flex flex-wrap gap-2 mb-4">
                                {#each userSkillMap[selectedNode.data.id] as skillId}
                                    {#if skills.find(s => s.id === skillId)}
                                        <span class="bg-green-900/50 text-xs px-2 py-1 rounded border border-green-500">
                                            {skills.find(s => s.id === skillId).name}
                                        </span>
                                    {/if}
                                {/each}
                            </div>
                        {:else}
                            <p class="text-gray-400 text-sm italic mb-4">No skills specified</p>
                            <script>
                                console.log("Debug - No skills found:", {
                                    userData: selectedNode.data,
                                    userSkillMapEntry: selectedNode.data?.id ? userSkillMap[selectedNode.data.id] : null,
                                    allSkills: skills
                                });
                            </script>
                        {/if}
                        
                        <h4 class="text-gray-300 font-medium mb-2">Matching Tasks:</h4>
                        <div class="space-y-2">
                            {#each processedTasks.filter(task => {
                                const taskSkillIds = (taskSkills[task.id] || []).map(s => s.id);
                                const userSkillIds = (selectedNode.data.skills || []).map((s: {id: number}) => s.id);
                                return taskSkillIds.some(skillId => userSkillIds.includes(skillId));
                            }) as matchingTask}
                                <div class="border border-yellow-500/30 bg-yellow-900/20 p-2 rounded text-sm">
                                    <div class="flex justify-between items-center">
                                        <span>{matchingTask.title}</span>
                                        <span class="text-xs bg-white/10 px-2 py-0.5 rounded capitalize">{matchingTask.priority}</span>
                                    </div>
                                    {#if matchingTask.assignedToId === selectedNode.data.id}
                                        <span class="text-xs text-green-400 mt-1 block">Assigned to this user</span>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            
            {:else if selectedNode.type === 'skill'}
                <div class="info-content text-white">
                    <h3 class="text-xl font-bold mb-4">{selectedNode.data.name}</h3>
                    
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
