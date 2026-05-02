import { z } from 'zod';

export const searchWorkspacesSchema = z.object({
  query: z
    .string()
    .optional()
    .describe('Part of the workspace name to look for.'),
});

export const getWorkspaceOverviewSchema = z.object({
  workspaceId: z
    .string()
    .optional()
    .describe('Optional workspace ID to override current context.'),
});

export const createWorkspaceSchema = z.object({
  title: z.string().describe('Title of the new workspace'),
  description: z.string().optional().describe('Optional description'),
});
