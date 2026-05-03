import type { IAiResult } from '../../interfaces/ai.interfaces';
import { BaseMessage } from '@langchain/core/messages';
import { AgentRunOptions } from '../interfaces/agent.interfaces';

export abstract class AgentPort {
  abstract runAgentGraph(
    messages: BaseMessage[],
    workspaceId: string,
    options: AgentRunOptions,
  ): Promise<IAiResult>;
}
