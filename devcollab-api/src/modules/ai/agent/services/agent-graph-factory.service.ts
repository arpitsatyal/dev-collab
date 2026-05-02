import { Injectable } from '@nestjs/common';
import { AIMessage } from '@langchain/core/messages';
import {
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AgentNodesService } from './agent-nodes.service';

@Injectable()
export class AgentGraphFactoryService {
  constructor(private readonly nodesService: AgentNodesService) {}

  /**
   * Constructs and compiles a standard reasoning-tool graph.
   */
  createGraph(llm: any, tools: any[]) {
    const toolNode = new ToolNode(tools);
    const checkpointer = new MemorySaver();

    const graph = new StateGraph(MessagesAnnotation)
      .addNode('agent', (state, config) =>
        this.nodesService.callModel(state, llm, config),
      )
      .addNode('tools', (state, config) =>
        this.nodesService.callTools(state, toolNode, config),
      )
      .addEdge('__start__', 'agent')
      .addConditionalEdges(
        'agent',
        (state: typeof MessagesAnnotation.State) => {
          const lastMessage = state.messages[
            state.messages.length - 1
          ] as AIMessage;
          return lastMessage.tool_calls?.length ? 'tools' : '__end__';
        },
      )
      .addEdge('tools', 'agent')
      .compile({
        checkpointer,
      });

    return graph;
  }
}
