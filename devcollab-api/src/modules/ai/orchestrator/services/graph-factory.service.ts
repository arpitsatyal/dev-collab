import { Injectable } from '@nestjs/common';
import { StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { LlmModel } from 'src/modules/ai/llm/llm.types';
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
  ) { }

  createGraph(llm: LlmModel, tools: DynamicStructuredTool[]) {
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

    const supervisorLlm = llm.bindTools(supervisorTools);

    const graph = new StateGraph(GraphState)
      .addNode('supervisor', (state, config: AgentRunnableConfig) =>
        this.nodesService.callModel(
          state,
          supervisorLlm,
          config,
          'You are a supervisor router. Your ONLY job is to analyze the user request and route to the correct worker using the delegate tools. CRITICAL: You must ONLY call ONE delegate tool at a time. Do NOT route to multiple workers in a single turn. Wait for a worker to finish before delegating the next step. NEVER attempt to answer questions yourself. If the task is fully complete, do not use any tools and end the mission.',
        ),
      )
      .addNode('supervisor_tools', (state, config: AgentRunnableConfig) =>
        this.nodesService.callTools(
          state,
          new ToolNode(supervisorTools as any),
          config,
        ),
      )
      .addEdge('__start__', 'supervisor')
      .addConditionalEdges('supervisor', (state) => {
        return OrchestratorStateUtils.hasToolCalls(state.messages)
          ? 'supervisor_tools'
          : '__end__';
      })
      .addConditionalEdges('supervisor_tools', (state) =>
        this.workerGraphService.resolveWorkerRoute(
          state.messages,
          workerDefinitions,
        ),
      );

    workerDefinitions.forEach((worker) => {
      const workerLlm = llm.bindTools(worker.tools);

      graph
        .addNode(worker.agentNode, (state, config: AgentRunnableConfig) =>
          this.nodesService.callModel(
            state,
            workerLlm,
            config,
            `You are the ${worker.agentNode}. Use your available tools to complete the task delegated to you by the supervisor. CRITICAL: Look at the latest supervisor router tool execution response in the message history (e.g. "Assigned task: ...") to see your exact assigned sub-task and execute ONLY that specific task. You must ONLY use the exact tool names provided in your tool schema. Do NOT hallucinate tool names or attempt to call tools you do not have (e.g., if you are docs_agent, do NOT try to call 'create_work_item' or 'create_snippet'). Only focus on the parts of the user request that fall under your specific domain. Leave the rest for the supervisor to delegate to other workers. If you have finished using your tools, do NOT make another tool call, simply respond to hand control back to the supervisor.`,
          ),
        )
        .addNode(worker.toolNode, (state, config: AgentRunnableConfig) =>
          this.nodesService.callTools(
            state,
            new ToolNode(worker.tools as any),
            config,
          ),
        )
        .addConditionalEdges(worker.agentNode, (state) =>
          OrchestratorStateUtils.hasToolCalls(state.messages)
            ? worker.toolNode
            : 'supervisor',
        )
        .addEdge(worker.toolNode, 'supervisor');
    });

    const interruptNodes = [
      'supervisor_tools',
      ...workerDefinitions.map((worker) => worker.toolNode),
    ];

    const app = graph.compile({
      checkpointer,
      interruptBefore: interruptNodes as any,
    });

    return app;
  }
}
