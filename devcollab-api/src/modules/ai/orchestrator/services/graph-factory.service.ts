import { Injectable } from '@nestjs/common';
import { StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { StructuredTool } from '@langchain/core/tools';
import { ToolBoundLlm } from 'src/modules/ai/orchestrator/llm/llm.types';
import { GraphNodesService } from './graph-nodes.service';
import { GraphPersistenceService } from './graph-persistence.service';
import { GraphState } from '../state/graph.state';
import { AgentRunnableConfig } from '../types/orchestrator.types';
import { OrchestratorStateUtils } from '../utils/orchestrator-state.utils';

@Injectable()
export class GraphFactoryService {
  constructor(
    private readonly nodesService: GraphNodesService,
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

    const graph = new StateGraph(GraphState)
      .addNode('agent', (state, config: AgentRunnableConfig) =>
        this.nodesService.callModel(state, llm, config),
      )
      .addNode('tools', (state, config: AgentRunnableConfig) =>
        this.nodesService.callTools(state, toolNode, config),
      )
      .addNode('pause', () => ({}))
      .addEdge('__start__', 'agent')
      .addConditionalEdges(
        'agent',
        (state) => {
          // Periodic interruption every 3 steps
          if (state.iterationCount > 0 && state.iterationCount % 3 === 0) {
            return 'pause';
          }

          return OrchestratorStateUtils.hasToolCalls(state.messages) ? 'tools' : '__end__';
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
