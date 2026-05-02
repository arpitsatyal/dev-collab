import { z } from 'zod';

export const getSnippetsSchema = z.object({
  titleFilter: z
    .string()
    .nullable()
    .optional()
    .describe('Keyword to filter snippets by title.'),
  workspaceId: z
    .string()
    .nullable()
    .optional()
    .describe('Target workspace ID.'),
});

export const createSnippetSchema = z.object({
  title: z.string().describe('Title of the snippet'),
  language: z.string().describe('Programming language'),
  content: z.string().describe('Code content'),
  extension: z
    .string()
    .nullable()
    .optional()
    .describe('File extension (e.g., ".ts")'),
  workspaceId: z
    .string()
    .nullable()
    .optional()
    .describe('Target workspace ID.'),
});
