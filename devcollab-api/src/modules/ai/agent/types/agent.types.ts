import { AgentConfigurable } from 'src/common/events/agent-events.types';

export interface AgentRunOptions {
  threadId: string;
  configurable?: AgentConfigurable;
  autoApprove?: boolean;
}
