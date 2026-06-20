import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

export const chats = pgTable('Chat', {
  id: text('id').primaryKey(),
  senderId: text('senderId'),
  title: text('title'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export type Chat = InferSelectModel<typeof chats>;

export const messages = pgTable('Message', {
  id: text('id').primaryKey(),
  chatId: text('chatId').notNull(),
  content: text('content').notNull(),
  isUser: boolean('isUser').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type Message = InferSelectModel<typeof messages>;
