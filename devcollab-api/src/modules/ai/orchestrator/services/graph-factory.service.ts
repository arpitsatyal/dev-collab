import { Injectable } from '@nestjs/common';
import { StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ToolBoundLlm } from 'src/modules/ai/llm/llm.types';
import { GraphNodesService } from './graph-nodes.service';
import { GraphPersistenceService } from './graph-persistence.service';
import { GraphState } from '../state/graph.state';
import { AgentRunnableConfig } from '../types/orchestrator.types';
import { OrchestratorStateUtils } from '../utils/orchestrator-state.utils';
import { WorkerGraphService } from './worker-graph.service';

@Injectable()
export class GraphFactoryService {
  constructor(
    private readonly nodesService: GraphNodesService,
    private readonly persistenceService: GraphPersistenceService,
    private readonly workerGraphService: WorkerGraphService,
  ) {}

  createGraph(llm: ToolBoundLlm, tools: DynamicStructuredTool[]) {
    const supervisorTools =
      this.workerGraphService.createSupervisorRouterTools();
    const workerDefinitions =
      this.workerGraphService.buildWorkerDefinitions(tools);
    const checkpointer = this.persistenceService.getSaver();

    if (!checkpointer) {
      console.warn(
        'WARNING: No checkpointer found. Human-in-the-loop (HITL) will NOT work.',
      );
    } else {
      console.log('SUCCESS: Graph compiled with persistent checkpointer.');
    }

    const graph = new StateGraph(GraphState)
      .addNode('supervisor', (state, config: AgentRunnableConfig) =>
        this.nodesService.callModel(state, llm, config),
      )
      .addNode('supervisor_tools', (state, config: AgentRunnableConfig) =>
        this.nodesService.callTools(
          state,
          new ToolNode(supervisorTools as any),
          config,
        ),
      )
      .addNode('pause', () => ({}))
      .addEdge('__start__', 'supervisor')
      .addConditionalEdges('supervisor', (state) => {
        if (state.iterationCount > 0 && state.iterationCount % 3 === 0) {
          return 'pause';
        }

        return OrchestratorStateUtils.hasToolCalls(state.messages)
          ? 'supervisor_tools'
          : '__end__';
      })
      .addConditionalEdges('supervisor_tools', (state) =>
        this.workerGraphService.resolveWorkerRoute(
          state.messages,
          workerDefinitions,
        ),
      )
      .addEdge('pause', 'supervisor');

    workerDefinitions.forEach((worker) =>
      this.workerGraphService.attachWorkerGraph(
        graph,
        this.nodesService,
        llm,
        worker,
      ),
    );

    const interruptNodes = [
      'supervisor_tools',
      'pause',
      ...workerDefinitions.map((worker) => worker.toolNode),
    ];

    const app = graph.compile({
      checkpointer,
      interruptBefore: interruptNodes as any,
    });

    return app;
  }
}
