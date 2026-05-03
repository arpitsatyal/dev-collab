import type { IAiResult } from 'src/modules/ai/interfaces/ai.interfaces';
import { LlmMessage } from 'src/modules/ai/interfaces/ai.types';
import { AgentRunOptions } from '../interfaces/agent.interfaces';

export abstract class AgentPort {
  abstract runAgentGraph(
    messages: LlmMessage[],
    workspaceId: string,
    options: AgentRunOptions,
  ): Promise<IAiResult>;
}
