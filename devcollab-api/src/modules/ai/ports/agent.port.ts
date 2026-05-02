import type { IAiResult } from '../interfaces/ai.interfaces';
import { BaseMessage } from '@langchain/core/messages';

export abstract class AgentPort {
  abstract runAgentGraph(
    messages: BaseMessage[],
    workspaceId: string,
    missionId?: string,
  ): Promise<IAiResult>;
}
