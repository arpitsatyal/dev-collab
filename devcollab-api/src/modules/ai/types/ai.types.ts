import { z } from 'zod';
import { RunnableLike } from '@langchain/core/runnables';
import { IntentSchema } from '../schemas';

export type IintentResult = z.infer<typeof IntentSchema>;

export type ChatScope = 'APP_SPECIFIC' | 'DOMAIN_KNOWLEDGE' | 'OUT_OF_SCOPE';

export type IntentClassifierLlm = RunnableLike<
  Record<string, any>,
  IintentResult
>;
