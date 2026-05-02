import { BaseMessage } from "@langchain/core/messages";
import { MessagesAnnotation } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';

export type AgentState = typeof MessagesAnnotation.State;

export interface AgentConfigurable extends Record<string, any> {
  missionId?: string;
  workspaceId?: string;
  thread_id?: string;
}

export interface AgentRunnableConfig extends RunnableConfig {
  configurable?: AgentConfigurable;
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
