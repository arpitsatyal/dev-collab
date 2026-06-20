import { Injectable } from '@nestjs/common';
import { StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { HumanMessage } from '@langchain/core/messages';
import { LlmModel } from 'src/modules/ai/llm/llm.types';
import { GraphNodesService } from './graph-nodes.service';
import { GraphPersistenceService } from './graph-persistence.service';
import {
  GraphReflectionService,
  MAX_REFLECTION_RETRIES,
} from './graph-reflection.service';
import { GraphState } from '../state/graph.state';
import { AgentRunnableConfig } from '../types/orchestrator.types';
import { OrchestratorStateUtils } from '../utils/orchestrator-state.utils';
import { WorkerGraphService } from './worker-graph.service';
import { GraphOrchestratorPromptService } from './graph-orchestrator-prompt.service';

@Injectable()
export class GraphFactoryService {
  constructor(
    private readonly nodesService: GraphNodesService,
    private readonly persistenceService: GraphPersistenceService,
    private readonly workerGraphService: WorkerGraphService,
    private readonly reflectionService: GraphReflectionService,
    private readonly promptService: GraphOrchestratorPromptService,
  ) {}

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

    const supervisorAllowedToolNames = supervisorTools.map((tool) => tool.name);
    const supervisorLlm = llm.bindTools(supervisorTools);

    // ── Core nodes ───────────────────────────────────────────────────────────
    const graph = new StateGraph(GraphState)
      // 1. Mission-capture node: runs once at graph entry to snapshot the user
      //    mission into state before the supervisor sees it.
      .addNode('capture_mission', (state) => {
        const firstHuman = state.messages.find((m) => m.type === 'human');
        const mission = firstHuman
          ? OrchestratorStateUtils.getContent(firstHuman)
          : '';
        return { missionContext: mission };
      })

      // 2. Supervisor: decides which worker to delegate to.
      .addNode('supervisor', (state, config: AgentRunnableConfig) =>
        this.nodesService.callModel(
          state,
          supervisorLlm,
          config,
          this.promptService.buildSupervisorRouterSystemPrompt(),
        ),
      )
      .addNode('supervisor_tools', (state, config: AgentRunnableConfig) =>
        this.nodesService.callTools(
          state,
          new ToolNode(supervisorTools as any),
          config,
        ),
      )
      .addNode('supervisor_tool_validation', (state) => {
        const invalidToolNames = OrchestratorStateUtils.getToolNames(state.messages).filter(
          (toolName) => !supervisorAllowedToolNames.includes(toolName),
        );

        if (invalidToolNames.length === 0) {
          return {};
        }

        return {
          messages: [
            new HumanMessage({
              content:
                `The supervisor attempted to call invalid tools: ${invalidToolNames.join(', ')}. ` +
                `Use only the delegate tools: ${supervisorAllowedToolNames.join(', ')}. ` +
                `Do not call workspace tools like get_docs, create_doc, or update_doc directly from the supervisor router. ` +
                `Reroute the task using the appropriate delegate tool instead.`,
            }),
          ],
        };
      })

      .addNode('reflect', (state, config: AgentRunnableConfig) =>
        this.reflectionService.reflect(state, llm as any, config),
      )

      // ── Static edges ────────────────────────────────────────────────────────
      .addEdge('__start__', 'capture_mission')
      .addEdge('capture_mission', 'supervisor')

      // ── Supervisor conditional edges ─────────────────────────────────────
      .addConditionalEdges('supervisor', (state) => {
        const toolNames = OrchestratorStateUtils.getToolNames(state.messages);
        if (toolNames.length === 0) return '__end__';
        return toolNames.every((name) => supervisorAllowedToolNames.includes(name))
          ? 'supervisor_tools'
          : 'supervisor_tool_validation';
      })
      .addConditionalEdges('supervisor_tools', (state) =>
        this.workerGraphService.resolveWorkerRoute(
          state.messages,
          workerDefinitions,
        ),
      )
      .addEdge('supervisor_tool_validation', 'supervisor');

    // ── Worker nodes ─────────────────────────────────────────────────────────
    workerDefinitions.forEach((worker) => {
      const workerLlm = llm.bindTools(worker.tools);

      graph
        .addNode(worker.agentNode, (state, config: AgentRunnableConfig) =>
          this.nodesService.callModel(
            state,
            workerLlm,
            config,
            this.promptService.buildWorkerSystemPrompt(
              worker.agentNode,
              worker.toolNames,
            ),
          ),
        )
        .addNode(worker.toolNode, (state, config: AgentRunnableConfig) =>
          this.nodesService.callTools(
            state,
            new ToolNode(worker.tools as any),
            config,
          ),
        )
        // Stamp lastWorkerNode immediately after the agent decides it is done,
        // before we decide whether to call tools or reflect.
        .addNode(`${worker.agentNode}_stamp`, () => ({
          lastWorkerNode: worker.agentNode,
        }))
        // Agent always passes through stamp first.
        .addEdge(worker.agentNode, `${worker.agentNode}_stamp`)
        // Stamp decides: still have tool calls → run tools; otherwise → reflect.
        .addConditionalEdges(`${worker.agentNode}_stamp`, (state) =>
          OrchestratorStateUtils.hasToolCalls(state.messages)
            ? worker.toolNode
            : 'reflect',
        )
        // After tools execute, loop back to the agent to reason about results
        // (or make more tool calls). The agent will then hit the stamp → reflect
        // path when it is satisfied.
        .addEdge(worker.toolNode, worker.agentNode);
    });

    // ── Reflection conditional edge ──────────────────────────────────────────
    graph.addConditionalEdges('reflect', (state) => {
      const lastEntry = state.reflectionLog[state.reflectionLog.length - 1];

      if (
        !lastEntry ||
        lastEntry.verdict === 'PASS' ||
        lastEntry.verdict === 'ABORT'
      ) {
        return 'supervisor';
      }

      // REVISE: guard against runaway loops (belt-and-suspenders; the service
      // also checks, but the graph edge is the authoritative gate).
      if (state.reflectionCount >= MAX_REFLECTION_RETRIES) {
        return 'supervisor';
      }

      return 'supervisor';
    });

    // ── Interrupt points ─────────────────────────────────────────────────────
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
