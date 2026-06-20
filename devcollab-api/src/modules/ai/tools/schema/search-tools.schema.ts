import { z } from 'zod';

export const semanticSearchSchema = z.object({
  searchQuery: z.string().describe('The natural language search query.'),
  workspaceId: z
    .string()
    .nullable()
    .optional()
    .describe('Target workspace ID.'),
});
