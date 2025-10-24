import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
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
		.where(
			and(
				eq(table.userOrganization.userId, userId),
				eq(table.userOrganization.organizationId, orgId)
			)
		);

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
		.innerJoin(table.user, eq(table.userOrganization.userId, table.user.id))
		.where(eq(table.userOrganization.organizationId, orgId));

	const assignedUser = alias(table.user, 'assigned_user');
	const creatorUser = alias(table.user, 'creator_user');

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
			assignedToUsername: assignedUser.username,
			createdById: table.task.createdById,
			createdByUsername: creatorUser.username
		})
		.from(table.task)
		.leftJoin(assignedUser, eq(table.task.assignedToId, assignedUser.id))
		.leftJoin(creatorUser, eq(table.task.createdById, creatorUser.id))
		.where(eq(table.task.organizationId, orgId));

	const taskIds = tasks.map((t) => t.id);

	// Fetch all assignees for tasks
	let taskAssignees: { taskId: number; userId: string; username: string }[] = [];
	if (taskIds.length > 0) {
		taskAssignees = await db
			.select({
				taskId: table.taskAssignment.taskId,
				userId: table.taskAssignment.userId,
				username: table.user.username
			})
			.from(table.taskAssignment)
			.innerJoin(table.user, eq(table.taskAssignment.userId, table.user.id))
			.where(inArray(table.taskAssignment.taskId, taskIds));
	}

	const assigneesByTask = new Map<number, { userId: string; username: string }[]>();
	for (const entry of taskAssignees) {
		const list = assigneesByTask.get(entry.taskId) ?? [];
		list.push({ userId: entry.userId, username: entry.username });
		assigneesByTask.set(entry.taskId, list);
	}

	const tasksWithAssignees = tasks.map((task) => {
		const assignees =
			assigneesByTask.get(task.id) ??
			(task.assignedToId && task.assignedToUsername
				? [{ userId: task.assignedToId, username: task.assignedToUsername }]
				: []);
		return { ...task, assignees, createdBy: task.createdByUsername ?? '' };
	});

	// Group tasks by status
	const groupedTasks = {
		backlog: tasksWithAssignees.filter((task) => task.status === 'backlog'),
		todo: tasksWithAssignees.filter((task) => task.status === 'todo'),
		'in-progress': tasksWithAssignees.filter((task) => task.status === 'in-progress'),
		done: tasksWithAssignees.filter((task) => task.status === 'done')
	};

	// Fetch all skills for task creation
	const skills = await db.select().from(table.skill).orderBy(table.skill.name);

	// Fetch task skills for each task
	let taskSkillsData: {
		taskId: number;
		skillId: number;
		skillName: string;
		skillCategory: string | null;
	}[] = [];
	if (taskIds.length > 0) {
		taskSkillsData = await db
			.select({
				taskId: table.taskSkill.taskId,
				skillId: table.taskSkill.skillId,
				skillName: table.skill.name,
				skillCategory: table.skill.category
			})
			.from(table.taskSkill)
			.innerJoin(table.skill, eq(table.taskSkill.skillId, table.skill.id))
			.where(inArray(table.taskSkill.taskId, taskIds));
	}

	// Organize task skills by task ID
	const taskSkills: Record<string, { id: number; name: string; category: string | null }[]> = {};

	taskSkillsData.forEach((item) => {
		if (!taskSkills[item.taskId]) {
			taskSkills[item.taskId] = [];
		}

		taskSkills[item.taskId].push({
			id: item.skillId,
			name: item.skillName,
			category: item.skillCategory
		});
	});

	let pendingInvites: { id: number; inviteeUsername: string; invitedAt: Date }[] = [];
	if (userMembership.role === 'admin') {
		const inviteeUser = alias(table.user, 'invitee_user');
		pendingInvites = await db
			.select({
				id: table.organizationInvitation.id,
				inviteeUsername: inviteeUser.username,
				invitedAt: table.organizationInvitation.createdAt,
				status: table.organizationInvitation.status
			})
			.from(table.organizationInvitation)
			.innerJoin(inviteeUser, eq(table.organizationInvitation.inviteeId, inviteeUser.id))
			.where(
				and(
					eq(table.organizationInvitation.organizationId, orgId),
					eq(table.organizationInvitation.status, 'pending')
				)
			);
	}

	return {
		organization,
		members,
		userRole: userMembership.role,
		userId,
		tasks: groupedTasks,
		skills,
		taskSkills,
		pendingInvites
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
			.where(
				and(
					eq(table.userOrganization.userId, userId),
					eq(table.userOrganization.organizationId, orgId)
				)
			);

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
			.where(
				and(
					eq(table.userOrganization.userId, userToInvite.id),
					eq(table.userOrganization.organizationId, orgId)
				)
			);

		if (existingMembership) {
			return fail(400, { error: 'User is already a member of this organization' });
		}

		// Create or refresh invitation instead of direct membership
		try {
			const [existingInvite] = await db
				.select({
					id: table.organizationInvitation.id,
					status: table.organizationInvitation.status
				})
				.from(table.organizationInvitation)
				.where(
					and(
						eq(table.organizationInvitation.organizationId, orgId),
						eq(table.organizationInvitation.inviteeId, userToInvite.id)
					)
				);

			if (existingInvite) {
				if (existingInvite.status === 'pending') {
					return fail(400, { error: 'User already has a pending invitation' });
				}

				await db
					.update(table.organizationInvitation)
					.set({
						status: 'pending',
						inviterId: userId,
						createdAt: new Date(),
						respondedAt: null
					})
					.where(eq(table.organizationInvitation.id, existingInvite.id));
			} else {
				await db.insert(table.organizationInvitation).values({
					organizationId: orgId,
					inviterId: userId,
					inviteeId: userToInvite.id
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Error adding member:', error);
			return fail(500, { error: 'Failed to send invitation' });
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
			.where(
				and(
					eq(table.userOrganization.userId, userId),
					eq(table.userOrganization.organizationId, orgId)
				)
			);

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
			const orgTasks = await db
				.select({ id: table.task.id })
				.from(table.task)
				.where(eq(table.task.organizationId, orgId));
			const orgTaskIds = orgTasks.map((task) => task.id);

			if (orgTaskIds.length > 0) {
				await db
					.delete(table.taskAssignment)
					.where(
						and(
							eq(table.taskAssignment.userId, memberId),
							inArray(table.taskAssignment.taskId, orgTaskIds)
						)
					);
				await db
					.update(table.task)
					.set({ assignedToId: null })
					.where(and(eq(table.task.assignedToId, memberId), inArray(table.task.id, orgTaskIds)));
			}

			await db
				.delete(table.userOrganization)
				.where(
					and(
						eq(table.userOrganization.userId, memberId),
						eq(table.userOrganization.organizationId, orgId)
					)
				);

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
			return fail(403, { error: 'Transfer ownership or delete the organization before leaving.' });
		}

		// Remove the user from the organization
		try {
			const orgTasks = await db
				.select({ id: table.task.id })
				.from(table.task)
				.where(eq(table.task.organizationId, orgId));
			const orgTaskIds = orgTasks.map((task) => task.id);

			if (orgTaskIds.length > 0) {
				await db
					.delete(table.taskAssignment)
					.where(
						and(
							eq(table.taskAssignment.userId, userId),
							inArray(table.taskAssignment.taskId, orgTaskIds)
						)
					);
				await db
					.update(table.task)
					.set({ assignedToId: null })
					.where(and(eq(table.task.assignedToId, userId), inArray(table.task.id, orgTaskIds)));
			}

			await db
				.delete(table.userOrganization)
				.where(
					and(
						eq(table.userOrganization.userId, userId),
						eq(table.userOrganization.organizationId, orgId)
					)
				);

			// Redirect to organizations list after successful leave
			throw redirect(302, '/dashboard/organizations');
		} catch (error) {
			if ((error as { status?: number }).status && (error as { location?: string }).location) {
				throw error;
			}
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
			.where(
				and(
					eq(table.userOrganization.userId, userId),
					eq(table.userOrganization.organizationId, orgId)
				)
			);

		if (!userMembership) {
			return fail(403, { error: 'Only organization members can create tasks' });
		}

		const formData = await event.request.formData();
		const title = formData.get('title')?.toString();
		const description = formData.get('description')?.toString() || null;
		const status = formData.get('status')?.toString() || 'backlog';
		const priority = formData.get('priority')?.toString() || 'medium';
		const assignedToIds = Array.from(
			new Set(
				formData
					.getAll('assignedToIds')
					.map((value) => value?.toString())
					.filter((value): value is string => Boolean(value))
			)
		);

		if (!title) {
			return fail(400, { error: 'Task title is required' });
		}

		// If assignees are provided, verify each user is a member of the organization
		for (const assigneeId of assignedToIds) {
			const [assignedUserMembership] = await db
				.select()
				.from(table.userOrganization)
				.where(
					and(
						eq(table.userOrganization.userId, assigneeId),
						eq(table.userOrganization.organizationId, orgId)
					)
				);

			if (!assignedUserMembership) {
				return fail(400, { error: 'Assigned user is not a member of this organization' });
			}
		}

		// Get any skill IDs from the form
		const skillIds = Array.from(
			new Set(formData.getAll('skillIds').map((value) => parseInt(value.toString())))
		).filter((id) => !Number.isNaN(id));

		try {
			// Insert the task and get its ID
			const [newTask] = await db
				.insert(table.task)
				.values({
					title,
					description,
					status,
					priority,
					createdById: userId,
					organizationId: orgId,
					createdAt: new Date(),
					assignedToId: assignedToIds[0] ?? null
				})
				.returning({ id: table.task.id });

			// Attach assignees to the task
			if (assignedToIds.length > 0) {
				await db.insert(table.taskAssignment).values(
					assignedToIds.map((userId) => ({
						taskId: newTask.id,
						userId
					}))
				);
			}

			// If there are skills selected, add them to the task_skill table
			if (skillIds.length > 0) {
				// Create entries for task_skill relation
				const taskSkillValues = skillIds.map((skillId) => ({
					taskId: newTask.id,
					skillId,
					importance: 3 // Default medium importance
				}));

				// Insert the task skills
				await db.insert(table.taskSkill).values(taskSkillValues);
			}

			return { success: true };
		} catch (error) {
			console.error('Error creating task:', error);
			return fail(500, { error: 'Failed to create task' });
		}
	},

	deleteOrganization: async (event) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const orgId = parseInt(event.params.id);
		if (isNaN(orgId)) {
			return fail(400, { error: 'Invalid organization ID' });
		}

		const userId = event.locals.user.id;

		const [organization] = await db
			.select({
				id: table.organization.id,
				createdById: table.organization.createdById
			})
			.from(table.organization)
			.where(eq(table.organization.id, orgId));

		if (!organization) {
			return fail(404, { error: 'Organization not found' });
		}

		if (organization.createdById !== userId) {
			return fail(403, { error: 'Only the organization owner can delete it' });
		}

		try {
			await db.transaction(async (tx) => {
				const taskRows = await tx
					.select({ id: table.task.id })
					.from(table.task)
					.where(eq(table.task.organizationId, orgId));

				const taskIds = taskRows.map((task) => task.id);

				if (taskIds.length > 0) {
					await tx
						.delete(table.taskAssignment)
						.where(inArray(table.taskAssignment.taskId, taskIds));

					await tx.delete(table.taskSkill).where(inArray(table.taskSkill.taskId, taskIds));

					await tx.delete(table.task).where(inArray(table.task.id, taskIds));
				}

				await tx
					.delete(table.userOrganization)
					.where(eq(table.userOrganization.organizationId, orgId));

				await tx
					.delete(table.organizationInvitation)
					.where(eq(table.organizationInvitation.organizationId, orgId));

				await tx.delete(table.organization).where(eq(table.organization.id, orgId));
			});

			throw redirect(302, '/dashboard/organizations');
		} catch (error) {
			if ((error as { status?: number }).status && (error as { location?: string }).location) {
				throw error;
			}
			console.error('Error deleting organization:', error);
			return fail(500, { error: 'Failed to delete organization' });
		}
	},

	updateTask: async (event) => {
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
			.where(
				and(
					eq(table.userOrganization.userId, userId),
					eq(table.userOrganization.organizationId, orgId)
				)
			);

		if (!userMembership) {
			return fail(403, { error: 'Only organization members can update tasks' });
		}

		const formData = await event.request.formData();
		const taskId = parseInt(formData.get('taskId')?.toString() ?? '');

		if (Number.isNaN(taskId)) {
			return fail(400, { error: 'Invalid task identifier' });
		}

		const [task] = await db
			.select()
			.from(table.task)
			.where(and(eq(table.task.id, taskId), eq(table.task.organizationId, orgId)));

		if (!task) {
			return fail(404, { error: 'Task not found' });
		}

		const title = formData.get('title')?.toString();
		const description = formData.get('description')?.toString() || null;
		const status = formData.get('status')?.toString() || 'backlog';
		const priority = formData.get('priority')?.toString() || 'medium';

		if (!title) {
			return fail(400, { error: 'Task title is required' });
		}

		const assignedToIds = Array.from(
			new Set(
				formData
					.getAll('assignedToIds')
					.map((value) => value?.toString())
					.filter((value): value is string => Boolean(value))
			)
		);

		for (const assigneeId of assignedToIds) {
			const [assigneeMembership] = await db
				.select()
				.from(table.userOrganization)
				.where(
					and(
						eq(table.userOrganization.userId, assigneeId),
						eq(table.userOrganization.organizationId, orgId)
					)
				);

			if (!assigneeMembership) {
				return fail(400, { error: 'Assigned user is not a member of this organization' });
			}
		}

		const skillIds = Array.from(
			new Set(
				formData
					.getAll('skillIds')
					.map((value) => parseInt(value.toString()))
					.filter((id) => !Number.isNaN(id))
			)
		);

		try {
			await db.transaction(async (tx) => {
				await tx
					.update(table.task)
					.set({
						title,
						description,
						status,
						priority,
						assignedToId: assignedToIds[0] ?? null
					})
					.where(eq(table.task.id, taskId));

				await tx.delete(table.taskAssignment).where(eq(table.taskAssignment.taskId, taskId));

				if (assignedToIds.length > 0) {
					await tx.insert(table.taskAssignment).values(
						assignedToIds.map((assigneeId) => ({
							taskId,
							userId: assigneeId
						}))
					);
				}

				await tx.delete(table.taskSkill).where(eq(table.taskSkill.taskId, taskId));

				if (skillIds.length > 0) {
					await tx.insert(table.taskSkill).values(
						skillIds.map((skillId) => ({
							taskId,
							skillId,
							importance: 3
						}))
					);
				}
			});

			return { success: true };
		} catch (error) {
			console.error('Error updating task:', error);
			return fail(500, { error: 'Failed to update task' });
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
			.where(
				and(
					eq(table.userOrganization.userId, userId),
					eq(table.userOrganization.organizationId, orgId)
				)
			);

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
			.where(and(eq(table.task.id, taskId), eq(table.task.organizationId, orgId)));

		if (!task) {
			return fail(404, { error: 'Task not found' });
		}

		try {
			await db.update(table.task).set({ status }).where(eq(table.task.id, taskId));

			return { success: true };
		} catch (error) {
			console.error('Error updating task status:', error);
			return fail(500, { error: 'Failed to update task status' });
		}
	}
};
