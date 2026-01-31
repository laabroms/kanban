import { pgTable, text, timestamp, uuid, boolean, integer } from 'drizzle-orm/pg-core';

export const epics = pgTable('epics', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#3b82f6'), // blue-500 default
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Epic = typeof epics.$inferSelect;
export type NewEpic = typeof epics.$inferInsert;

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  columnId: text('column_id', { enum: ['backlog', 'in-progress', 'review', 'done'] }).notNull().default('backlog'),
  epicId: uuid('epic_id').references(() => epics.id, { onDelete: 'set null' }),
  prUrl: text('pr_url'), // Pull request URL
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  author: text('author').notNull().default('Anonymous'), // Name of commenter
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export const passcodes = pgTable('passcodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull(), // hashed 6-digit code
  name: text('name').notNull(), // label for the passcode (e.g., "Lucas", "Guest")
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
});

export type Passcode = typeof passcodes.$inferSelect;
export type NewPasscode = typeof passcodes.$inferInsert;

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  passcodeId: uuid('passcode_id').notNull().references(() => passcodes.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
