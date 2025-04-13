import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const orgId = parseInt(event.params.id);
	if (isNaN(orgId)) {
		return redirect(302, '/dashboard/organizations');
	}

	const userId = event.locals.user.id;

	const [userMembership] = await db
		.select()
		.from(table.userOrganization)
		.where(and(
			eq(table.userOrganization.userId, userId),
			eq(table.userOrganization.organizationId, orgId)
		));

	if (!userMembership) {
		return redirect(302, '/dashboard/organizations');
	}

	const [organization] = await db
		.select()
		.from(table.organization)
		.where(eq(table.organization.id, orgId));

	if (!organization) {
		return redirect(302, '/dashboard/organizations');
	}

	const members = await db
		.select({
			userId: table.user.id,
			username: table.user.username,
			role: table.userOrganization.role
		})
		.from(table.userOrganization)
		.innerJoin(
			table.user,
			eq(table.userOrganization.userId, table.user.id)
		)
		.where(eq(table.userOrganization.organizationId, orgId));
	
	const tasks = await db
		.select({
			id: table.task.id,
			title: table.task.title,
			description: table.task.description,
			status: table.task.status,
			priority: table.task.priority,
			createdAt: table.task.createdAt,
			dueDate: table.task.dueDate,
			assignedToId: table.task.assignedToId,
			assignedToUsername: table.user.username,
			createdById: table.task.createdById
		})
		.from(table.task)
		.leftJoin(
			table.user,
			eq(table.task.assignedToId, table.user.id)
		)
		.where(eq(table.task.organizationId, orgId));
	
	const groupedTasks = {
		backlog: tasks.filter(task => task.status === 'backlog'),
		todo: tasks.filter(task => task.status === 'todo'),
		'in-progress': tasks.filter(task => task.status === 'in-progress'),
		done: tasks.filter(task => task.status === 'done')
	};
	
	const skills = await db.select().from(table.skill).orderBy(table.skill.name);
	
	const taskSkillsData = await db
		.select({
			taskId: table.taskSkill.taskId,
			skillId: table.taskSkill.skillId,
			skillName: table.skill.name,
			skillCategory: table.skill.category
		})
		.from(table.taskSkill)
		.innerJoin(
			table.skill,
			eq(table.taskSkill.skillId, table.skill.id)
		)
		.where(
			inArray(table.taskSkill.taskId, tasks.map(t => t.id))
		);
	
	const taskSkills: Record<string, { id: number, name: string, category: string | null }[]> = {};
	
	taskSkillsData.forEach(item => {
		if (!taskSkills[item.taskId]) {
			taskSkills[item.taskId] = [];
		}
		
		taskSkills[item.taskId].push({
			id: item.skillId,
			name: item.skillName,
			category: item.skillCategory
		});
	});

	return {
		organization,
		members,
		userRole: userMembership.role,
		userId,
		tasks: groupedTasks,
		skills,
		taskSkills
	};
};

export const actions: Actions = {
	inviteMember: async (event) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const orgId = parseInt(event.params.id);
		if (isNaN(orgId)) {
			return fail(400, { error: 'Invalid organization ID' });
		}

		const userId = event.locals.user.id;

		const [userMembership] = await db
			.select()
			.from(table.userOrganization)
			.where(and(
				eq(table.userOrganization.userId, userId),
				eq(table.userOrganization.organizationId, orgId)
			));

		if (!userMembership || userMembership.role !== 'admin') {
			return fail(403, { error: 'Only admins can invite new members' });
		}

		const formData = await event.request.formData();
		const username = formData.get('username')?.toString();

		if (!username) {
			return fail(400, { error: 'Username is required' });
		}

		const [userToInvite] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.username, username));

		if (!userToInvite) {
			return fail(404, { error: 'User not found' });
		}

		const [existingMembership] = await db
			.select()
			.from(table.userOrganization)
			.where(and(
				eq(table.userOrganization.userId, userToInvite.id),
				eq(table.userOrganization.organizationId, orgId)
			));

		if (existingMembership) {
			return fail(400, { error: 'User is already a member of this organization' });
		}

		try {
			await db.insert(table.userOrganization).values({
				userId: userToInvite.id,
				organizationId: orgId,
				role: 'member'
			});

			return { success: true };
		} catch (error) {
			console.error('Error adding member:', error);
			return fail(500, { error: 'Failed to add member to organization' });
		}
	},

	removeMember: async (event) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const orgId = parseInt(event.params.id);
		if (isNaN(orgId)) {
			return fail(400, { error: 'Invalid organization ID' });
		}

		const userId = event.locals.user.id;

		const [userMembership] = await db
			.select()
			.from(table.userOrganization)
			.where(and(
				eq(table.userOrganization.userId, userId),
				eq(table.userOrganization.organizationId, orgId)
			));

		if (!userMembership || userMembership.role !== 'admin') {
			return fail(403, { error: 'Only admins can remove members' });
		}

		const formData = await event.request.formData();
		const memberId = formData.get('memberId')?.toString();

		if (!memberId) {
			return fail(400, { error: 'Member ID is required' });
		}

		const [organization] = await db
			.select()
			.from(table.organization)
			.where(eq(table.organization.id, orgId));

		if (memberId === organization.createdById) {
			return fail(403, { error: 'Cannot remove the organization owner' });
		}

		if (memberId === userId) {
			return fail(400, { error: 'Cannot remove yourself. Use leave organization instead' });
		}

		try {
			await db
				.delete(table.userOrganization)
				.where(and(
					eq(table.userOrganization.userId, memberId),
					eq(table.userOrganization.organizationId, orgId)
				));

			return { success: true };
		} catch (error) {
			console.error('Error removing member:', error);
			return fail(500, { error: 'Failed to remove member from organization' });
		}
	},

	leaveOrganization: async (event) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const orgId = parseInt(event.params.id);
		if (isNaN(orgId)) {
			return fail(400, { error: 'Invalid organization ID' });
		}

		const userId = event.locals.user.id;

		const [organization] = await db
			.select()
			.from(table.organization)
			.where(eq(table.organization.id, orgId));

		if (userId === organization.createdById) {
			return fail(403, { error: 'Organization creators cannot leave their organizations' });
		}

		try {
			await db
				.delete(table.userOrganization)
				.where(and(
					eq(table.userOrganization.userId, userId),
					eq(table.userOrganization.organizationId, orgId)
				));

			return redirect(302, '/dashboard/organizations');
		} catch (error) {
			console.error('Error leaving organization:', error);
			return fail(500, { error: 'Failed to leave organization' });
		}
	},

	createTask: async (event) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const orgId = parseInt(event.params.id);
		if (isNaN(orgId)) {
			return fail(400, { error: 'Invalid organization ID' });
		}

		const userId = event.locals.user.id;

		const [userMembership] = await db
			.select()
			.from(table.userOrganization)
			.where(and(
				eq(table.userOrganization.userId, userId),
				eq(table.userOrganization.organizationId, orgId)
			));

		if (!userMembership) {
			return fail(403, { error: 'Only organization members can create tasks' });
		}

		const formData = await event.request.formData();
		const title = formData.get('title')?.toString();
		const description = formData.get('description')?.toString() || null;
		const status = formData.get('status')?.toString() || 'backlog';
		const priority = formData.get('priority')?.toString() || 'medium';
		const assignedToId = formData.get('assignedToId')?.toString() || null;

		if (!title) {
			return fail(400, { error: 'Task title is required' });
		}

		if (assignedToId) {
			const [assignedUserMembership] = await db
				.select()
				.from(table.userOrganization)
				.where(and(
					eq(table.userOrganization.userId, assignedToId),
					eq(table.userOrganization.organizationId, orgId)
				));

			if (!assignedUserMembership) {
				return fail(400, { error: 'Assigned user is not a member of this organization' });
			}
		}

		const skillIds = formData.getAll('skillIds').map(id => parseInt(id.toString()));

		try {
			const [newTask] = await db.insert(table.task).values({
				title,
				description,
				status,
				priority,
				createdById: userId,
				organizationId: orgId,
				createdAt: new Date(),
				assignedToId: assignedToId || null
			}).returning({ id: table.task.id });
			
			if (skillIds.length > 0) {
				const taskSkillValues = skillIds.map(skillId => ({
					taskId: newTask.id,
					skillId,
					importance: 3
				}));
				
				await db.insert(table.taskSkill).values(taskSkillValues);
			}

			return { success: true };
		} catch (error) {
			console.error('Error creating task:', error);
			return fail(500, { error: 'Failed to create task' });
		}
	},

	updateTaskStatus: async (event) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const orgId = parseInt(event.params.id);
		if (isNaN(orgId)) {
			return fail(400, { error: 'Invalid organization ID' });
		}

		const userId = event.locals.user.id;

		const [userMembership] = await db
			.select()
			.from(table.userOrganization)
			.where(and(
				eq(table.userOrganization.userId, userId),
				eq(table.userOrganization.organizationId, orgId)
			));

		if (!userMembership) {
			return fail(403, { error: 'Only organization members can update tasks' });
		}

		const formData = await event.request.formData();
		const taskId = parseInt(formData.get('taskId')?.toString() || '');
		const status = formData.get('status')?.toString();

		if (isNaN(taskId) || !status) {
			return fail(400, { error: 'Invalid task data' });
		}

		const [task] = await db
			.select()
			.from(table.task)
			.where(and(
				eq(table.task.id, taskId),
				eq(table.task.organizationId, orgId)
			));

		if (!task) {
			return fail(404, { error: 'Task not found' });
		}

		try {
			await db
				.update(table.task)
				.set({ status })
				.where(eq(table.task.id, taskId));

			return { success: true };
		} catch (error) {
			console.error('Error updating task status:', error);
			return fail(500, { error: 'Failed to update task status' });
		}
	}
};
