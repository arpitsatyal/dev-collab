import { BaseMessage } from "@langchain/core/messages";
import { RunnableConfig } from '@langchain/core/runnables';
import { AgentConfigurable } from 'src/common/events/agent-events.types';

export interface AgentRunnableConfig extends RunnableConfig {
  configurable?: AgentConfigurable;
}

export interface AgentNodeResult {
  messages: BaseMessage[];
}
