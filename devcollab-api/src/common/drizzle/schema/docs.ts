import { pgTable, text, timestamp, json } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const docs = pgTable('Doc', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  workspaceId: text('workspaceId').notNull(),
  roomId: text('roomId').unique().notNull(),
  content: json('content').default({}),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export type Doc = InferSelectModel<typeof docs>;
export type DocInsert = InferInsertModel<typeof docs>;
