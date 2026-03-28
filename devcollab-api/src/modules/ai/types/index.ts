import { z } from 'zod';
import { IntentSchema } from '../schemas';
import { BaseMessage } from '@langchain/core/messages';
import { RunnableLike } from '@langchain/core/runnables';

export type IntentResult = z.infer<typeof IntentSchema>;

export type IntentClassifierLlm = RunnableLike<BaseMessage[], IntentResult> & {
  invoke: (input: BaseMessage[]) => Promise<IntentResult>;
};
