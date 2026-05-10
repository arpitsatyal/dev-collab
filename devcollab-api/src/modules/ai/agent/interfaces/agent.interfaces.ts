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
    public readonly type: 'TOOL_START' | 'TOOL_END' | 'REASONING_START' | 'REASONING_END',
    public readonly label: string,
    public readonly callId?: string,
    public readonly payload?: any,
  ) { }
}
