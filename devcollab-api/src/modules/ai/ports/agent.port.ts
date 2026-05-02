import type { IAiResult } from '../interfaces/ai.interfaces';
import { BaseMessage } from '@langchain/core/messages';

export abstract class AgentPort {
  abstract runAgentGraph(
    messages: BaseMessage[],
    workspaceId: string,
    options?: {
      threadId?: string;
      configurable?: Record<string, any>;
    },
  ): Promise<IAiResult>;
}
