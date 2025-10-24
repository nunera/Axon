import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Redirect unauthenticated users to login page
	if (!event.locals.user) {
		return redirect(302, '/login');
	}
	
	const userId = event.locals.user.id;
	
	// Fetch organizations that the user is a member of
	const userOrgs = await db
		.select({
			id: table.organization.id,
			name: table.organization.name,
			description: table.organization.description,
			createdAt: table.organization.createdAt,
			role: table.userOrganization.role
		})
		.from(table.userOrganization)
		.innerJoin(
			table.organization,
			eq(table.userOrganization.organizationId, table.organization.id)
		)
		.where(eq(table.userOrganization.userId, userId));
	
	const inviter = alias(table.user, 'inviter');

	const pendingInvites = await db
		.select({
			id: table.organizationInvitation.id,
			organizationId: table.organizationInvitation.organizationId,
			organizationName: table.organization.name,
			inviterUsername: inviter.username,
			createdAt: table.organizationInvitation.createdAt
		})
		.from(table.organizationInvitation)
		.innerJoin(table.organization, eq(table.organizationInvitation.organizationId, table.organization.id))
		.innerJoin(inviter, eq(table.organizationInvitation.inviterId, inviter.id))
		.where(
			and(
				eq(table.organizationInvitation.inviteeId, userId),
				eq(table.organizationInvitation.status, 'pending')
			)
		);

	return {
		organizations: userOrgs,
		invites: pendingInvites
	};
};

export const actions: Actions = {
	createOrganization: async (event) => {
		// Check authentication
		if (!event.locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}
		
		const userId = event.locals.user.id;
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString() || null;
		
		// Basic validation
		if (!name) {
			return fail(400, { message: 'Organization name is required' });
		}
		
		if (name.length < 2 || name.length > 100) {
			return fail(400, { message: 'Organization name must be between 2 and 100 characters' });
		}
		
		try {
			// Insert the organization
			const [newOrg] = await db
				.insert(table.organization)
				.values({
					name,
					description,
					createdById: userId
				})
				.returning();
			
			// Add the creator as an admin
			await db.insert(table.userOrganization).values({
				userId,
				organizationId: newOrg.id,
				role: 'admin'
			});
			
			return { success: true };
		} catch (error) {
			console.error('Error creating organization:', error);
			return fail(500, { message: 'Failed to create organization' });
		}
	},
	acceptInvite: async (event) => {
		if (!event.locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await event.request.formData();
		const inviteId = parseInt(formData.get('inviteId')?.toString() ?? '');

		if (Number.isNaN(inviteId)) {
			return fail(400, { message: 'Invalid invitation' });
		}

		const userId = event.locals.user.id;

		const [invite] = await db
			.select({
				id: table.organizationInvitation.id,
				organizationId: table.organizationInvitation.organizationId,
				status: table.organizationInvitation.status
			})
			.from(table.organizationInvitation)
			.where(
				and(
					eq(table.organizationInvitation.id, inviteId),
					eq(table.organizationInvitation.inviteeId, userId)
				)
			);

		if (!invite) {
			return fail(404, { message: 'Invitation not found' });
		}

		if (invite.status !== 'pending') {
			return fail(400, { message: 'Invitation already processed' });
		}

		try {
			await db.transaction(async (tx) => {
				await tx
					.update(table.organizationInvitation)
					.set({ status: 'accepted', respondedAt: new Date() })
					.where(eq(table.organizationInvitation.id, inviteId));

				await tx
					.insert(table.userOrganization)
					.values({
						userId,
						organizationId: invite.organizationId,
						role: 'member'
					})
					.onConflictDoNothing({
						target: [table.userOrganization.userId, table.userOrganization.organizationId]
					});
			});

			return { success: true };
		} catch (error) {
			console.error('Error accepting invite:', error);
			return fail(500, { message: 'Failed to accept invitation' });
		}
	},
	declineInvite: async (event) => {
		if (!event.locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await event.request.formData();
		const inviteId = parseInt(formData.get('inviteId')?.toString() ?? '');

		if (Number.isNaN(inviteId)) {
			return fail(400, { message: 'Invalid invitation' });
		}

		const userId = event.locals.user.id;

		const [invite] = await db
			.select({
				id: table.organizationInvitation.id,
				status: table.organizationInvitation.status
			})
			.from(table.organizationInvitation)
			.where(
				and(
					eq(table.organizationInvitation.id, inviteId),
					eq(table.organizationInvitation.inviteeId, userId)
				)
			);

		if (!invite) {
			return fail(404, { message: 'Invitation not found' });
		}

		if (invite.status !== 'pending') {
			return fail(400, { message: 'Invitation already processed' });
		}

		try {
			await db
				.update(table.organizationInvitation)
				.set({ status: 'declined', respondedAt: new Date() })
				.where(eq(table.organizationInvitation.id, inviteId));

			return { success: true };
		} catch (error) {
			console.error('Error declining invite:', error);
			return fail(500, { message: 'Failed to decline invitation' });
		}
	}
};
