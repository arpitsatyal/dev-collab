import { pgTable, text, boolean, timestamp, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations, InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const providerEnum = pgEnum('Provider', ['GOOGLE', 'GITHUB', 'LOCAL']);
export const workItemStatusValues = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export const workItemStatusEnum = pgEnum('WorkItemStatus', workItemStatusValues);
export type WorkItemStatus = (typeof workItemStatusValues)[number];

export const users = pgTable('User', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  name: text('name'),
  image: text('image'),
  provider: providerEnum('provider').notNull(),
  emailVerified: timestamp('emailVerified'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type User = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;

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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  snippets: many(snippets),
  workItems: many(workItems),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  snippets: many(snippets),
  docs: many(docs),
  workItems: many(workItems),
}));

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

export const docsRelations = relations(docs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [docs.workspaceId],
    references: [workspaces.id],
  }),
}));

export const snippetsRelations = relations(snippets, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [snippets.workspaceId],
    references: [workspaces.id],
  }),
  author: one(users, {
    fields: [snippets.authorId],
    references: [users.id],
  }),
  workItems: many(workItemsToSnippets),
}));

export const workItemsRelations = relations(workItems, ({ one, many }) => ({
  assignedTo: one(users, {
    fields: [workItems.assignedToId],
    references: [users.id],
  }),
  author: one(users, {
    fields: [workItems.authorId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [workItems.workspaceId],
    references: [workspaces.id],
  }),
  snippets: many(workItemsToSnippets),
}));

export const workItemsToSnippetsRelations = relations(workItemsToSnippets, ({ one }) => ({
  workItem: one(workItems, {
    fields: [workItemsToSnippets.workItemId],
    references: [workItems.id],
  }),
  snippet: one(snippets, {
    fields: [workItemsToSnippets.snippetId],
    references: [snippets.id],
  }),
}));
