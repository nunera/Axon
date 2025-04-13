import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { eq, inArray, or } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect unauthenticated users to login page
	if (!locals.user) {
		return { status: 302, redirect: '/login' };
	}
	
	const userId = locals.user.id;
	
	try {
		// Get organizations the user belongs to
		const userOrgs = await db
			.select({
				id: schema.organization.id
			})
			.from(schema.userOrganization)
			.innerJoin(
				schema.organization,
				eq(schema.userOrganization.organizationId, schema.organization.id)
			)
			.where(eq(schema.userOrganization.userId, userId));
			
		const orgIds = userOrgs.map(org => org.id);
		
		// Get all tasks assigned to the user or belonging to their organizations
		const tasks = await db
			.select({
				id: schema.task.id,
				title: schema.task.title,
				description: schema.task.description,
				status: schema.task.status,
				priority: schema.task.priority,
				createdAt: schema.task.createdAt,
				dueDate: schema.task.dueDate,
				assignedToId: schema.task.assignedToId,
				organizationId: schema.task.organizationId,
				orgName: schema.organization.name,
				createdBy: schema.user.username
			})
			.from(schema.task)
			.leftJoin(schema.user, eq(schema.task.createdById, schema.user.id))
			.leftJoin(schema.organization, eq(schema.task.organizationId, schema.organization.id))
			.where(
				orgIds.length > 0
					? or(
							eq(schema.task.assignedToId, userId),
							inArray(schema.task.organizationId, orgIds)
					  )
					: eq(schema.task.assignedToId, userId)
			);

		// Get all skills associated with the tasks
		const taskIds = tasks.map(task => task.id);
		const taskSkills = taskIds.length > 0 
			? await db
				.select({
					taskId: schema.taskSkill.taskId,
					skillId: schema.taskSkill.skillId,
					skillName: schema.skill.name
				})
				.from(schema.taskSkill)
				.innerJoin(schema.skill, eq(schema.taskSkill.skillId, schema.skill.id))
				.where(inArray(schema.taskSkill.taskId, taskIds))
			: [];
			
		// Group tasks by status
		const groupedTasks = {
			backlog: tasks.filter(task => task.status === 'backlog'),
			todo: tasks.filter(task => task.status === 'todo'),
			'in-progress': tasks.filter(task => task.status === 'in-progress'),
			done: tasks.filter(task => task.status === 'done')
		};
		
		// Group skills by task
		const taskSkillMap = taskSkills.reduce((acc, ts) => {
			if (!acc[ts.taskId]) {
				acc[ts.taskId] = [];
			}
			acc[ts.taskId].push({
				id: ts.skillId,
				name: ts.skillName
			});
			return acc;
		}, {} as Record<number, { id: number; name: string }[]>);
		
		return {
			tasks: groupedTasks,
			taskSkills: taskSkillMap
		};
	} catch (e) {
		console.error('Error loading tasks:', e);
		throw error(500, 'Failed to load tasks');
	}
};

export const actions: Actions = {
	createTask: async ({ request, locals }) => {
		const userId = locals.user?.id;
		if (!userId) {
			return fail(401, { message: 'You must be logged in to create a task' });
		}

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const status = formData.get('status') as string || 'backlog';
		const priority = formData.get('priority') as string || 'medium';
		const organizationId = Number(formData.get('organizationId')) || null;
		
		// Basic validation
		if (!title) {
			return fail(400, { message: 'Title is required' });
		}
		
		try {
			// Insert task
			const [newTask] = await db
				.insert(schema.task)
				.values({
					title,
					description,
					status,
					priority,
					createdById: userId,
					organizationId
				})
				.returning();
				
			// We'll add skill handling in a future implementation
			
			return { success: true, task: newTask };
		} catch (e) {
			console.error('Error creating task:', e);
			return fail(500, { message: 'Failed to create task' });
		}
	},
	
	updateTaskStatus: async ({ request, locals }) => {
		const userId = locals.user?.id;
		if (!userId) {
			return fail(401, { message: 'You must be logged in to update tasks' });
		}

		const formData = await request.formData();
		const taskId = Number(formData.get('taskId'));
		const status = formData.get('status') as string;
		
		// Basic validation
		if (!taskId || !status) {
			return fail(400, { message: 'Task ID and status are required' });
		}
		
		try {
			await db
				.update(schema.task)
				.set({ status })
				.where(eq(schema.task.id, taskId));
				
			return { success: true };
		} catch (e) {
			console.error('Error updating task:', e);
			return fail(500, { message: 'Failed to update task' });
		}
	}
};
