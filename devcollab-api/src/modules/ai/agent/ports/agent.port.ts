import type { IAiResult } from 'src/modules/ai/types/ai.types';
import { LlmMessage } from 'src/modules/ai/types/ai.types';
import { AgentRunOptions } from '../types/agent.types';

export abstract class AgentPort {
  abstract execute(
    messages: LlmMessage[],
    workspaceId: string,
    options: AgentRunOptions,
  ): Promise<IAiResult>;
}

export abstract class AgentOrchestrator {
  abstract run(
    messages: LlmMessage[],
    workspaceId: string,
    options: AgentRunOptions,
  ): Promise<IAiResult>;
}
