import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect unauthenticated users to login page
	if (!locals.user) {
		return { status: 302, redirect: '/login' };
	}

	const userId = locals.user.id;

	try {
		// Get user data
		const userData = await db.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1);

		if (!userData.length) {
			throw new Error('User not found');
		}

		const user = userData[0];

		// Get all available skills for selection
		const skills = await db.select().from(schema.skill).orderBy(schema.skill.name);

		// Get user's current skills with proficiency
		const userSkillsData = await db
			.select({
				skillId: schema.skill.id,
				skillName: schema.skill.name,
				proficiency: schema.userSkill.proficiency,
				verified: schema.userSkill.verified
			})
			.from(schema.userSkill)
			.innerJoin(schema.skill, eq(schema.userSkill.skillId, schema.skill.id))
			.where(eq(schema.userSkill.userId, userId));

		// Format user skills for the front end
		const userSkills = userSkillsData.map((skill) => ({
			id: skill.skillId,
			name: skill.skillName,
			proficiency: skill.proficiency,
			verified: skill.verified
		}));

		return {
			user,
			skills,
			userSkills
		};
	} catch (e) {
		console.error('Error loading profile data:', e);
		throw Error('Failed to load profile data');
	}
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be logged in to update your profile' });
		}

		const userId = locals.user.id;
		const formData = await request.formData();
		const bio = formData.get('bio') as string;

		try {
			await db.update(schema.user).set({ bio }).where(eq(schema.user.id, userId));

			return { success: true };
		} catch (e) {
			console.error('Error updating profile:', e);
			return fail(500, { message: 'Failed to update profile' });
		}
	},

	addSkill: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be logged in to add skills' });
		}

		const userId = locals.user.id;
		const formData = await request.formData();
		const isCustom = formData.get('isCustom') === 'true';
		const proficiencyValue = formData.get('proficiency');

		// Convert proficiency to number or null
		const proficiency = proficiencyValue ? parseInt(proficiencyValue as string, 10) : null;

		try {
			let skillId: number;

			if (isCustom) {
				// Create a new custom skill
				const skillName = formData.get('skillName') as string;

				if (!skillName || skillName.trim() === '') {
					return fail(400, { message: 'Skill name is required' });
				}

				// Check if skill already exists
				const existingSkill = await db
					.select()
					.from(schema.skill)
					.where(eq(schema.skill.name, skillName))
					.limit(1);

				if (existingSkill.length > 0) {
					// Use existing skill
					skillId = existingSkill[0].id;
				} else {
					// Create new skill
					const [newSkill] = await db
						.insert(schema.skill)
						.values({
							name: skillName,
							category: 'user-added'
						})
						.returning();

					skillId = newSkill.id;
				}
			} else {
				// Use existing skill ID
				const skillIdValue = formData.get('skillId');

				if (!skillIdValue) {
					return fail(400, { message: 'No skill selected' });
				}

				skillId = parseInt(skillIdValue as string, 10);
			}

			// Check if user already has this skill
			const existingUserSkill = await db
				.select()
				.from(schema.userSkill)
				.where(and(eq(schema.userSkill.userId, userId), eq(schema.userSkill.skillId, skillId)))
				.limit(1);

			if (existingUserSkill.length > 0) {
				// Update proficiency if user already has the skill
				await db
					.update(schema.userSkill)
					.set({ proficiency })
					.where(and(eq(schema.userSkill.userId, userId), eq(schema.userSkill.skillId, skillId)));
			} else {
				// Add new user skill
				await db.insert(schema.userSkill).values({
					userId,
					skillId,
					proficiency,
					verified: false
				});
			}

			return { success: true };
		} catch (e) {
			console.error('Error adding skill:', e);
			return fail(500, { message: 'Failed to add skill' });
		}
	},

	updateSkill: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be logged in to update skills' });
		}

		const userId = locals.user.id;
		const formData = await request.formData();
		const skillId = parseInt(formData.get('skillId') as string, 10);
		const proficiency = parseInt(formData.get('proficiency') as string, 10);

		try {
			await db
				.update(schema.userSkill)
				.set({ proficiency })
				.where(and(eq(schema.userSkill.userId, userId), eq(schema.userSkill.skillId, skillId)));

			return { success: true };
		} catch (e) {
			console.error('Error updating skill:', e);
			return fail(500, { message: 'Failed to update skill' });
		}
	},

	removeSkill: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be logged in to remove skills' });
		}

		const userId = locals.user.id;
		const formData = await request.formData();
		const skillId = parseInt(formData.get('skillId') as string, 10);

		try {
			await db
				.delete(schema.userSkill)
				.where(and(eq(schema.userSkill.userId, userId), eq(schema.userSkill.skillId, skillId)));

			return { success: true };
		} catch (e) {
			console.error('Error removing skill:', e);
			return fail(500, { message: 'Failed to remove skill' });
		}
	}
};
