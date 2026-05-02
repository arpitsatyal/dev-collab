import { Injectable } from '@nestjs/common';
import {
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AgentNodesService } from './agent-nodes.service';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StructuredTool } from '@langchain/core/tools';
import { AgentStateUtils } from '../utils/agent-state.utils';
import { AgentRunnableConfig, AgentState } from '../interfaces/agent.interfaces';

@Injectable()
export class AgentGraphFactoryService {
  constructor(private readonly nodesService: AgentNodesService) { }

  createGraph(llm: BaseChatModel, tools: StructuredTool[]) {
    const toolNode = new ToolNode(tools);
    const checkpointer = new MemorySaver();

    const graph = new StateGraph(MessagesAnnotation)
      .addNode('agent', (state, config: AgentRunnableConfig) =>
        this.nodesService.callModel(state, llm, config),
      )
      .addNode('tools', (state, config: AgentRunnableConfig) =>
        this.nodesService.callTools(state, toolNode, config),
      )
      .addEdge('__start__', 'agent')
      .addConditionalEdges(
        'agent',
        (state: AgentState) => {
          return AgentStateUtils.hasToolCalls(state.messages) ? 'tools' : '__end__';
        },
      )
      .addEdge('tools', 'agent')
      .compile({
        checkpointer,
      });

    return graph;
  }
}
