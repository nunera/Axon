import { pgTable, serial, text, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	bio: text('bio'),
	avatarUrl: text('avatar_url')
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const organization = pgTable('organization', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	createdById: text('created_by_id').notNull().references(() => user.id)
});

export const userOrganization = pgTable(
	'user_organization',
	{
		userId: text('user_id')
			.notNull()
			.references(() => user.id),
		organizationId: integer('organization_id')
			.notNull()
			.references(() => organization.id),
		role: text('role').notNull().default('member') // 'admin', 'member'
	},
	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.organizationId] })
	})
);

// Import extended schema
import {
	task,
	skill, 
	userSkill,
	taskSkill,
	interest,
	userInterest,
	type Task,
	type Skill,
	type Interest
} from './schema-extension';

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Organization = typeof organization.$inferSelect;
export type UserOrganization = typeof userOrganization.$inferSelect;

// Export extended schema types and tables
export {
	task,
	skill, 
	userSkill,
	taskSkill,
	interest,
	userInterest
};

export type {
	Task,
	Skill,
	Interest
};
