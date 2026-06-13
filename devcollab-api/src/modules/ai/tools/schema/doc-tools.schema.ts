import { z } from 'zod';

export const getDocsSchema = z.object({
  labelFilter: z
    .string()
    .nullable()
    .optional()
    .describe('Label to filter docs.'),
  workspaceId: z
    .string()
    .nullable()
    .optional()
    .describe('Target workspace ID.'),
});

export const createDocSchema = z.object({
  label: z.string().describe('Label or title of the doc'),
  content: z
    .unknown()
    .nullable()
    .optional()
    .describe('The content of the document (string or markdown).'),
  workspaceId: z
    .string()
    .nullable()
    .optional()
    .describe('Target workspace ID.'),
});

export const updateDocSchema = z.object({
  id: z.string().describe('The ID of the document to update'),
  content: z.string().describe('The new content for the document'),
});
