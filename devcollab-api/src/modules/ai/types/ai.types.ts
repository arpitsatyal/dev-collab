import { z } from 'zod';
import type { Runnable } from '@langchain/core/runnables';
import { IntentSchema } from '../schemas';

export type IintentResult = z.infer<typeof IntentSchema>;

export type ChatScope = 'APP_SPECIFIC' | 'DOMAIN_KNOWLEDGE' | 'OUT_OF_SCOPE';

/** Structured-output chain from {@link LlmGateway.getReasoningStructuredLLM} */
export type IntentClassifierLlm = Runnable<unknown, IintentResult>;
