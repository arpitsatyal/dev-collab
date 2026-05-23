import { Injectable } from '@nestjs/common';
import { BaseMessage } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ToolBoundLlm } from 'src/modules/ai/llm/llm.types';
import { GraphNodesService } from '../services/graph-nodes.service';
import { AgentRunnableConfig } from '../types/orchestrator.types';
import { OrchestratorStateUtils } from '../utils/orchestrator-state.utils';

export type WorkerGraphDefinition = {
  delegateTool: string;
  agentNode: string;
  toolNode: string;
  toolNames: string[];
  tools: DynamicStructuredTool[];
};

@Injectable()
export class WorkerGraphService {
  buildWorkerDefinitions(
    tools: DynamicStructuredTool[],
  ): WorkerGraphDefinition[] {
    const definitions: Omit<WorkerGraphDefinition, 'tools'>[] = [
      {
        delegateTool: 'delegate_docs',
        agentNode: 'docs_agent',
        toolNode: 'docs_tools',
        toolNames: ['get_docs', 'create_doc', 'update_doc'],
      },
      {
        delegateTool: 'delegate_code',
        agentNode: 'code_agent',
        toolNode: 'code_tools',
        toolNames: ['get_snippets', 'create_snippet'],
      },
      {
        delegateTool: 'delegate_pm',
        agentNode: 'pm_agent',
        toolNode: 'pm_tools',
        toolNames: ['get_work_items', 'create_work_item', 'update_work_item'],
      },
      {
        delegateTool: 'delegate_workspace',
        agentNode: 'workspace_agent',
        toolNode: 'workspace_tools',
        toolNames: [
          'search_workspaces',
          'get_workspace_overview',
          'create_workspace',
        ],
      },
      {
        delegateTool: 'delegate_search',
        agentNode: 'search_agent',
        toolNode: 'search_tools',
        toolNames: ['semantic_search'],
      },
    ];

    return definitions.map((definition) => ({
      ...definition,
      tools: this.filterToolsByNames(tools, definition.toolNames),
    }));
  }

  attachWorkerGraph(
    graph: any,
    nodesService: GraphNodesService,
    llm: ToolBoundLlm,
    worker: WorkerGraphDefinition,
  ) {
    graph
      .addNode(worker.agentNode, (state, config: AgentRunnableConfig) =>
        nodesService.callModel(state, llm, config),
      )
      .addNode(worker.toolNode, (state, config: AgentRunnableConfig) =>
        nodesService.callTools(
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
  }

  resolveWorkerRoute(
    messages: BaseMessage[],
    workers: WorkerGraphDefinition[],
  ): string {
    const toolName = OrchestratorStateUtils.getLastToolMessageName(messages);
    const worker = workers.find((entry) => entry.delegateTool === toolName);
    return worker ? worker.agentNode : '__end__';
  }

  createSupervisorRouterTools(): DynamicStructuredTool[] {
    const routerTool = (name: string, description: string) =>
      new DynamicStructuredTool({
        name,
        description,
        schema: {
          type: 'object' as const,
          properties: {},
          additionalProperties: false,
        },
        func: async () => `Routing to ${description} worker.`,
      });

    return [
      routerTool('delegate_docs', 'Docs'),
      routerTool('delegate_code', 'Code'),
      routerTool('delegate_pm', 'Project/PM'),
      routerTool('delegate_workspace', 'Workspace overview'),
      routerTool('delegate_search', 'Semantic search'),
    ];
  }

  private filterToolsByNames(
    tools: DynamicStructuredTool[],
    names: string[],
  ): DynamicStructuredTool[] {
    return tools.filter((tool) => names.includes(tool.name));
  }
}
