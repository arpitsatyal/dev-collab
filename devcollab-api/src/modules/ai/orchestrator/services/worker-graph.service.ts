import { Injectable } from '@nestjs/common';
import { BaseMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
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
          properties: {
            task: {
              type: 'string',
              description: 'The specific sub-task instructions and context this worker should execute. Be detailed and specify exactly what needs to be created or updated.',
            },
          },
          required: ['task'],
          additionalProperties: true,
        },
        func: async (args: { task: string }) =>
          `Routing to ${description} worker. Assigned task: ${args.task}`,
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
