import { AgentActionType } from '../enums/agent.enums';

export interface AgentConfigurable extends Record<string, any> {
  contextId?: string;
  missionId?: string;
  workspaceId?: string;
  thread_id?: string;
}

export interface AgentRunOptions {
  threadId: string;
  configurable?: AgentConfigurable;
  autoApprove?: boolean;
}

export class AgentActionEvent {
  constructor(
    public readonly metadata: AgentConfigurable,
    public readonly type: AgentActionType,
    public readonly label: string,
    public readonly callId?: string,
    public readonly payload?: any,
  ) { }
}
