import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Redirect unauthenticated users to login page
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const orgId = parseInt(event.params.id);
	if (isNaN(orgId)) {
		return redirect(302, '/dashboard/organizations');
	}

	const userId = event.locals.user.id;

	// Check if user is a member of this organization
	const [userMembership] = await db
		.select()
		.from(table.userOrganization)
		.where(and(
			eq(table.userOrganization.userId, userId),
			eq(table.userOrganization.organizationId, orgId)
		));

	if (!userMembership) {
		// User is not a member of this organization
		return redirect(302, '/dashboard/organizations');
	}

	// Fetch organization details
	const [organization] = await db
		.select()
		.from(table.organization)
		.where(eq(table.organization.id, orgId));

	if (!organization) {
		return redirect(302, '/dashboard/organizations');
	}

	// Fetch members of the organization
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
	
	// Fetch organization tasks
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
	
	// Group tasks by status
	const groupedTasks = {
		backlog: tasks.filter(task => task.status === 'backlog'),
		todo: tasks.filter(task => task.status === 'todo'),
		'in-progress': tasks.filter(task => task.status === 'in-progress'),
		done: tasks.filter(task => task.status === 'done')
	};

	return {
		organization,
		members,
		userRole: userMembership.role,
		userId,
		tasks: groupedTasks
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

		// Check if user is an admin of this organization
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

		// Find the user to invite
		const [userToInvite] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.username, username));

		if (!userToInvite) {
			return fail(404, { error: 'User not found' });
		}

		// Check if user is already a member
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

		// Add the new member
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

		// Check if user is an admin of this organization
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

		// Get organization details to check if the member is the creator
		const [organization] = await db
			.select()
			.from(table.organization)
			.where(eq(table.organization.id, orgId));

		// Cannot remove the organization creator
		if (memberId === organization.createdById) {
			return fail(403, { error: 'Cannot remove the organization owner' });
		}

		// Cannot remove yourself this way
		if (memberId === userId) {
			return fail(400, { error: 'Cannot remove yourself. Use leave organization instead' });
		}

		// Remove the member
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

		// Get organization details to check if the user is the creator
		const [organization] = await db
			.select()
			.from(table.organization)
			.where(eq(table.organization.id, orgId));

		// Cannot leave if you are the creator
		if (userId === organization.createdById) {
			return fail(403, { error: 'Organization creators cannot leave their organizations' });
		}

		// Remove the user from the organization
		try {
			await db
				.delete(table.userOrganization)
				.where(and(
					eq(table.userOrganization.userId, userId),
					eq(table.userOrganization.organizationId, orgId)
				));

			// Redirect to organizations list after successful leave
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

		// Check if user is a member of this organization
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

		// If assignedToId is provided, verify that the assigned user is a member of the organization
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

		try {
			await db.insert(table.task).values({
				title,
				description,
				status,
				priority,
				createdById: userId,
				organizationId: orgId,
				createdAt: new Date(),
				assignedToId: assignedToId || null
			});

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

		// Check if user is a member of this organization
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

		// Verify the task belongs to this organization
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
