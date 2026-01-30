import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  columnId: text('column_id', { enum: ['backlog', 'in-progress', 'review', 'done'] }).notNull().default('backlog'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

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
