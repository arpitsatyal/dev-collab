import { Injectable } from '@nestjs/common';
import {
  Annotation,
  StateGraph,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AgentNodesService, AgentState } from './agent-nodes.service';
import { StructuredTool } from '@langchain/core/tools';
import { AgentStateUtils } from '../utils/agent-state.utils';
import { AgentRunnableConfig } from '../interfaces/agent.interfaces';
import { ToolBoundLlm } from 'src/modules/ai/llms/interfaces/llm.types';
import { GraphPersistenceService } from './graph-persistence.service';

@Injectable()
export class AgentGraphFactoryService {
  constructor(
    private readonly nodesService: AgentNodesService,
    private readonly persistenceService: GraphPersistenceService,
  ) { }

  createGraph(llm: ToolBoundLlm, tools: StructuredTool[]) {
    const toolNode = new ToolNode(tools);
    const checkpointer = this.persistenceService.getSaver();

    if (!checkpointer) {
      console.warn('WARNING: No checkpointer found. Human-in-the-loop (HITL) will NOT work.');
    } else {
      console.log('SUCCESS: Graph compiled with persistent checkpointer.');
    }

    const graph = new StateGraph(AgentState)
      .addNode('agent', (state, config: AgentRunnableConfig) =>
        this.nodesService.callModel(state, llm, config),
      )
      .addNode('tools', (state, config: AgentRunnableConfig) =>
        this.nodesService.callTools(state, toolNode, config),
      )
      .addNode('pause', () => ({ })) // Explicit pause node
      .addEdge('__start__', 'agent')
      .addConditionalEdges(
        'agent',
        (state) => {
          // Periodic interruption every 3 steps
          if (state.iterationCount > 0 && state.iterationCount % 3 === 0) {
            return 'pause';
          }

          return AgentStateUtils.hasToolCalls(state.messages) ? 'tools' : '__end__';
        },
      )
      .addEdge('tools', 'agent')
      .addEdge('pause', 'agent') // Continue back to agent after pause is cleared
      .compile({
        checkpointer,
        interruptBefore: ['tools', 'pause'],
      });

    return graph;
  }
}
