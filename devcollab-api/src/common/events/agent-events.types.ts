import { AgentActionType } from './agent-events.enums';

export interface AgentConfigurable extends Record<string, any> {
  contextId?: string;
  missionId?: string;
  workspaceId?: string;
  thread_id?: string;
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
