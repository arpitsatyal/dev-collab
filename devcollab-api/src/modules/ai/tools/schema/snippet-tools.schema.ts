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
  language: z.string().describe('Programming language (e.g., "typescript", "python", "javascript")'),
  content: z.string().describe('Code content'),
  extension: z
    .string()
    .describe('The exact file extension matching the programming language, starting with a dot (e.g., ".ts" for typescript, ".py" for python, ".js" for javascript, ".go" for go, ".rs" for rust)'),
  workspaceId: z
    .string()
    .nullable()
    .optional()
    .describe('Target workspace ID.'),
});
