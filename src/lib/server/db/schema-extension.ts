import { pgTable, serial, text, integer, timestamp, boolean, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';
import { user, organization } from './schema';

// Task table for the Kanban board
export const task = pgTable('task', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('backlog'), // backlog, todo, in-progress, done
  priority: text('priority').default('medium'), // low, medium, high
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { withTimezone: true, mode: 'date' }),
  createdById: text('created_by_id').notNull().references(() => user.id),
  assignedToId: text('assigned_to_id').references(() => user.id),
  organizationId: integer('organization_id').references(() => organization.id)
});

// Skills table
export const skill = pgTable('skill', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category') // e.g., technical, soft skill, etc.
});

// User skills - many-to-many relationship
export const userSkill = pgTable('user_skill', {
  userId: text('user_id').notNull().references(() => user.id),
  skillId: integer('skill_id').notNull().references(() => skill.id),
  proficiency: integer('proficiency'), // 1-5 scale, optional
  verified: boolean('verified').default(false)
});

// Task skills - many-to-many relationship
export const taskSkill = pgTable('task_skill', {
  taskId: integer('task_id').notNull().references(() => task.id),
  skillId: integer('skill_id').notNull().references(() => skill.id),
  importance: integer('importance') // 1-5 scale, optional
});

// Task assignees - many-to-many relationship between tasks and users
export const taskAssignment = pgTable(
  'task_assignment',
  {
    taskId: integer('task_id')
      .notNull()
      .references(() => task.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' })
  },
  (t) => ({
    pk: primaryKey({ columns: [t.taskId, t.userId] })
  })
);

export const organizationInvitation = pgTable(
  'organization_invitation',
  {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    inviteeId: text('invitee_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    respondedAt: timestamp('responded_at', { withTimezone: true, mode: 'date' })
  },
  (t) => ({
    uniqueInvite: uniqueIndex('organization_invitation_unique').on(t.organizationId, t.inviteeId)
  })
);

// Interests table
export const interest = pgTable('interest', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category') // e.g., hobby, professional interest
});

// User interests - many-to-many relationship
export const userInterest = pgTable('user_interest', {
  userId: text('user_id').notNull().references(() => user.id),
  interestId: integer('interest_id').notNull().references(() => interest.id),
  level: integer('level'), // 1-5 scale, optional
  isAiDetected: boolean('is_ai_detected').default(false)
});

// Export types
export type Task = typeof task.$inferSelect;
export type Skill = typeof skill.$inferSelect;
export type Interest = typeof interest.$inferSelect;
export type TaskAssignment = typeof taskAssignment.$inferSelect;
export type OrganizationInvitation = typeof organizationInvitation.$inferSelect;
