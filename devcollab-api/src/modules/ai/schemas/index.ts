import { z } from 'zod';

export const IntentSchema = z.object({
    intent: z.enum(['WORKSPACE_QUERY', 'CONVERSATIONAL']),
    scope: z.enum(['APP_SPECIFIC', 'OUT_OF_SCOPE']),
    confidence: z.number().min(0).max(1),
});