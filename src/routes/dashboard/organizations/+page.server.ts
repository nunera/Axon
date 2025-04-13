import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}
	
	const userId = event.locals.user.id;
	
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
	
	return {
		organizations: userOrgs
	};
};

export const actions: Actions = {
	createOrganization: async (event) => {
		if (!event.locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}
		
		const userId = event.locals.user.id;
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString() || null;
		
		if (!name) {
			return fail(400, { message: 'Organization name is required' });
		}
		
		if (name.length < 2 || name.length > 100) {
			return fail(400, { message: 'Organization name must be between 2 and 100 characters' });
		}
		
		try {
			const [newOrg] = await db
				.insert(table.organization)
				.values({
					name,
					description,
					createdById: userId
				})
				.returning();
			
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
	}
};
