import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';
import { chats, messages } from './chats';
import { docs } from './docs';
import { snippets } from './snippets';
import { workItems, workItemsToSnippets } from './work-items';
import { missions, missionSteps, missionLogs } from './missions';

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

export const workItemsToSnippetsRelations = relations(
  workItemsToSnippets,
  ({ one }) => ({
    workItem: one(workItems, {
      fields: [workItemsToSnippets.workItemId],
      references: [workItems.id],
    }),
    snippet: one(snippets, {
      fields: [workItemsToSnippets.snippetId],
      references: [snippets.id],
    }),
  }),
);

export const missionsRelations = relations(missions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [missions.workspaceId],
    references: [workspaces.id],
  }),
  steps: many(missionSteps),
  missionLogs: many(missionLogs),
}));

export const missionStepsRelations = relations(
  missionSteps,
  ({ one, many }) => ({
    mission: one(missions, {
      fields: [missionSteps.missionId],
      references: [missions.id],
    }),
    missionLogs: many(missionLogs),
  }),
);

export const missionLogsRelations = relations(missionLogs, ({ one }) => ({
  mission: one(missions, {
    fields: [missionLogs.missionId],
    references: [missions.id],
  }),
  step: one(missionSteps, {
    fields: [missionLogs.stepId],
    references: [missionSteps.id],
  }),
}));
