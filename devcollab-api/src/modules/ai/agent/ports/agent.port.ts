import type { IAiResult } from 'src/modules/ai/interfaces/ai.interfaces';
import { BaseMessage } from '@langchain/core/messages';
import { AgentRunOptions } from '../interfaces/agent.interfaces';

export abstract class AgentPort {
  abstract runAgentGraph(
    messages: BaseMessage[],
    workspaceId: string,
    options: AgentRunOptions,
  ): Promise<IAiResult>;
}
