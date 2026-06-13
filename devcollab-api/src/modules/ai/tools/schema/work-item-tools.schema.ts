import { z } from 'zod';

export const getWorkItemsSchema = z.object({
  titleFilter: z
    .string()
    .nullable()
    .optional()
    .describe('Search keyword to filter work item titles.'),
  workspaceId: z
    .string()
    .nullable()
    .optional()
    .describe('Target workspace ID.'),
});

export const createWorkItemSchema = z.object({
  title: z.string().describe('Task title'),
  description: z.string().nullable().optional().describe('Task detail'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).nullable().optional(),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .describe('Due date as string'),
  assignedToId: z
    .string()
    .nullable()
    .optional()
    .describe('User ID to assign to'),
  snippetIds: z
    .array(z.string())
    .nullable()
    .optional()
    .describe('Snippet IDs to link'),
  workspaceId: z
    .string()
    .nullable()
    .optional()
    .describe('Target workspace ID.'),
});

export const updateWorkItemSchema = z.object({
  id: z.string().describe('The ID of the work item to update'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).nullable().optional(),
});
