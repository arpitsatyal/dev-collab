import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const snippets = pgTable('Snippet', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  language: text('language').notNull(),
  content: text('content').notNull(),
  workspaceId: text('workspaceId').notNull(),
  authorId: text('authorId'),
  lastEditedById: text('lastEditedById'),
  extension: text('extension'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export type Snippet = InferSelectModel<typeof snippets>;
export type SnippetInsert = InferInsertModel<typeof snippets>;
