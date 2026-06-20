import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { workItemStatusEnum } from './enums';

export const workItems = pgTable('WorkItem', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: workItemStatusEnum('status').default('TODO').notNull(),
  assignedToId: text('assignedToId'),
  authorId: text('authorId'),
  workspaceId: text('workspaceId').notNull(),
  dueDate: timestamp('dueDate'),
  aiPlan: text('aiPlan'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export type WorkItem = InferSelectModel<typeof workItems>;
export type WorkItemInsert = InferInsertModel<typeof workItems>;

export const workItemsToSnippets = pgTable('WorkItemToSnippet', {
  workItemId: text('workItemId').notNull(),
  snippetId: text('snippetId').notNull(),
});
