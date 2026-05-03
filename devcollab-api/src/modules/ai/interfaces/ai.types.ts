import { z } from 'zod';
import { Runnable } from '@langchain/core/runnables';
import { IntentSchema } from '../schemas';

export type IintentResult = z.infer<typeof IntentSchema>;
export type ChatScope = 'APP_SPECIFIC' | 'DOMAIN_KNOWLEDGE' | 'OUT_OF_SCOPE';
export type IntentClassifierLlm = Runnable<unknown, IintentResult>;
