import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const workspaces = pgTable('Workspace', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  isPublic: boolean('isPublic').default(false).notNull(),
  ownerId: text('ownerId').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export type Workspace = InferSelectModel<typeof workspaces>;
export type WorkspaceInsert = InferInsertModel<typeof workspaces>;

export const userPinnedWorkspaces = pgTable('UserPinnedWorkspace', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  workspaceId: text('workspaceId').notNull(),
});
