import { BaseMessage } from "@langchain/core/messages";
import { RunnableConfig } from '@langchain/core/runnables';

export interface AgentConfigurable extends Record<string, any> {
  contextId?: string;
  missionId?: string;
  workspaceId?: string;
  thread_id?: string;
}

export interface AgentRunnableConfig extends RunnableConfig {
  configurable?: AgentConfigurable;
}

export interface AgentRunOptions {
  threadId: string;
  configurable?: AgentConfigurable;
  autoApprove?: boolean;
}

export interface AgentNodeResult {
  messages: BaseMessage[];
}

export class AgentActionEvent {
  constructor(
    public readonly metadata: AgentConfigurable,
    public readonly type: 'TOOL_START' | 'TOOL_END' | 'REASONING_START' | 'REASONING_END',
    public readonly label: string,
    public readonly callId?: string,
    public readonly payload?: any,
  ) { }
}
