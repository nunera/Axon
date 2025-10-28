import {
	pgTable,
	serial,
	text,
	integer,
	timestamp,
	boolean,
	primaryKey,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false),
	name: text('name'),
	username: text('username').notNull().unique(),
	// Allow display_username to be nullable: Better Auth may not provide this field on initial create.
	displayUsername: text('display_username').unique(),
	age: integer('age'),
	bio: text('bio'),
	avatarUrl: text('avatar_url'),
	image: text('image'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	token: text('token').notNull().default(sql`gen_random_uuid()::text`).unique(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	impersonatedBy: text('impersonated_by'),
	activeOrganizationId: text('active_organization_id')
});

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		providerId: text('provider_id').notNull(),
		accountId: text('account_id').notNull(),
		password: text('password'),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		scope: text('scope'),
		tokenType: text('token_type'),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
		sessionState: text('session_state'),
		idTokenClaims: text('id_token_claims'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true, mode: 'date' }),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true, mode: 'date' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
	},
	(account) => ({
		providerAccount: uniqueIndex('account_provider_account_idx').on(account.providerId, account.accountId)
	})
);

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' })
});

export const organization = pgTable('organization', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	createdById: text('created_by_id')
		.notNull()
		.references(() => user.id)
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
		role: text('role').notNull().default('member')
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
	taskAssignment,
	organizationInvitation,
	interest,
	userInterest,
	type Task,
	type Skill,
	type TaskAssignment,
	type OrganizationInvitation,
	type Interest
} from './schema-extension';

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Organization = typeof organization.$inferSelect;
export type UserOrganization = typeof userOrganization.$inferSelect;

export {
	task,
	skill,
	userSkill,
	taskSkill,
	taskAssignment,
	organizationInvitation,
	interest,
	userInterest
};

export type { Task, Skill, TaskAssignment, OrganizationInvitation, Interest };
