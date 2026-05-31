import { Injectable } from '@nestjs/common';
import { StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { LlmModel } from 'src/modules/ai/llm/llm.types';
import { GraphNodesService } from './graph-nodes.service';
import { GraphPersistenceService } from './graph-persistence.service';
import { GraphReflectionService, MAX_REFLECTION_RETRIES } from './graph-reflection.service';
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
    private readonly reflectionService: GraphReflectionService,
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

    // The supervisor and all workers share the same LLM instance (with their
    // respective tools bound), but the reflector uses an unbound LLM so it can
    // reason freely without tool-call noise.
    const supervisorLlm = llm.bindTools(supervisorTools);

    // ── Core nodes ───────────────────────────────────────────────────────────
    const graph = new StateGraph(GraphState)
      // 1. Mission-capture node: runs once at graph entry to snapshot the user
      //    mission into state before the supervisor sees it.
      .addNode('capture_mission', (state) => {
        const firstHuman = state.messages.find((m) => m.getType() === 'human');
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
          `You are a supervisor router. Your ONLY job is to analyze the user request and route to the correct worker using the delegate tools.

STRICT ROUTING DOMAIN RULES:
1. Routing to Code ('delegate_code'):
   - Use this for ANY request to create, update, or fetch a "snippet", "code snippet", "code block", programming logic, functions, scripts, or coding tasks (e.g. "create a new snippet called 'stereolab'").
   - Even if the name sounds non-technical or represents an abstract concept, if it is a snippet, it MUST go to the Code worker first.
2. Routing to Docs ('delegate_docs'):
   - Use this ONLY for writing user guides, handbooks, text document articles, guides, wikis, or conceptual document pages. Do NOT route here for writing code or snippets.
3. Routing to Project Management ('delegate_pm'):
   - Use this for work items, tasks, issues, tickets, or status updates.

CRITICAL: You must ONLY call ONE delegate tool at a time. Do NOT route to multiple workers in a single turn. Wait for a worker to finish before delegating the next step. NEVER attempt to answer questions yourself. If the task is fully complete, do not use any tools and end the mission.`,
        ),
      )
      .addNode('supervisor_tools', (state, config: AgentRunnableConfig) =>
        this.nodesService.callTools(
          state,
          new ToolNode(supervisorTools as any),
          config,
        ),
      )

      // 3. Reflection node: evaluates a worker's output and either approves it
      //    or injects a correction request back into the message stream.
      .addNode('reflect', (state, config: AgentRunnableConfig) =>
        this.reflectionService.reflect(state, llm as any, config),
      )

      // ── Static edges ────────────────────────────────────────────────────────
      .addEdge('__start__', 'capture_mission')
      .addEdge('capture_mission', 'supervisor')

      // ── Supervisor conditional edges ─────────────────────────────────────
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

    // ── Worker nodes ─────────────────────────────────────────────────────────
    workerDefinitions.forEach((worker) => {
      const workerLlm = llm.bindTools(worker.tools);

      graph
        .addNode(worker.agentNode, (state, config: AgentRunnableConfig) =>
          this.nodesService.callModel(
            state,
            workerLlm,
            config,
            `You are the ${worker.agentNode}. Use your available tools to complete the task delegated to you by the supervisor. 
CRITICAL RULES:
1. Look at the latest supervisor router tool execution response in the message history (e.g. "Assigned task: ...") to see your exact assigned sub-task and execute ONLY that specific task.
2. You must ONLY use the exact tool names provided in your tool schema: [${worker.toolNames.join(', ')}]. 
3. DO NOT attempt to delegate to other agents or call supervisor tools (such as 'delegate_docs', 'delegate_code', 'delegate_pm', 'delegate_workspace', 'delegate_search'). You do NOT have access to these tools and calling them will crash the system.
4. If you have finished your task or need to hand control back, do NOT attempt to call any more tools. Simply reply with normal text summarizing what you did, and control will automatically return to the supervisor.`,
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
    // PASS or ABORT → return control to supervisor (mission may be fully done).
    // REVISE → return to supervisor so it can re-delegate with the critique.
    // Both paths land on supervisor; the difference is whether a correction
    // HumanMessage was injected into the stream (handled inside reflect()).
    graph.addConditionalEdges('reflect', (state) => {
      const lastEntry = state.reflectionLog[state.reflectionLog.length - 1];

      if (!lastEntry || lastEntry.verdict === 'PASS' || lastEntry.verdict === 'ABORT') {
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
