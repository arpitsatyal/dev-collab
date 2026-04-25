export enum AgentEvents {
  ACTION = 'agent.action',
}

export interface AgentActionEvent {
  missionId: string;
  type: 'TOOL_START' | 'TOOL_END' | 'REASONING_START' | 'REASONING_END';
  label: string;
  callId?: string;
  payload?: any;
}
