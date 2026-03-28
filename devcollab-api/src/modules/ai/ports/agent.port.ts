import { BaseMessage } from '@langchain/core/messages';

export abstract class AgentPort {
  abstract runAgentGraph(
    messages: BaseMessage[],
    workspaceId: string,
  ): Promise<{ answer: string; calledTools: string[] }>;
}
