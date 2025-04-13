import { pgTable, serial, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { user, organization } from './schema';

export const task = pgTable('task', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('backlog'),
  priority: text('priority').default('medium'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { withTimezone: true, mode: 'date' }),
  createdById: text('created_by_id').notNull().references(() => user.id),
  assignedToId: text('assigned_to_id').references(() => user.id),
  organizationId: integer('organization_id').references(() => organization.id)
});

export const skill = pgTable('skill', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category')
});

export const userSkill = pgTable('user_skill', {
  userId: text('user_id').notNull().references(() => user.id),
  skillId: integer('skill_id').notNull().references(() => skill.id),
  proficiency: integer('proficiency'),
  verified: boolean('verified').default(false)
});

export const taskSkill = pgTable('task_skill', {
  taskId: integer('task_id').notNull().references(() => task.id),
  skillId: integer('skill_id').notNull().references(() => skill.id),
  importance: integer('importance')
});

export const interest = pgTable('interest', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category')
});

export const userInterest = pgTable('user_interest', {
  userId: text('user_id').notNull().references(() => user.id),
  interestId: integer('interest_id').notNull().references(() => interest.id),
  level: integer('level'),
  isAiDetected: boolean('is_ai_detected').default(false)
});

export type Task = typeof task.$inferSelect;
export type Skill = typeof skill.$inferSelect;
export type Interest = typeof interest.$inferSelect;
