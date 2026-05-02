export interface AgentActionEvent {
  metadata: Record<string, any>;
  type: 'TOOL_START' | 'TOOL_END' | 'REASONING_START' | 'REASONING_END';
  label: string;
  callId?: string;
  payload?: any;
}
