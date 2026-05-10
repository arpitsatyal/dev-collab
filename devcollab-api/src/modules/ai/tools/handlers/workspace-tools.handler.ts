import { Injectable } from '@nestjs/common';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { WorkspacesService } from 'src/modules/workspaces/workspaces.service';
import {
  createWorkspaceSchema,
  getWorkspaceOverviewSchema,
  searchWorkspacesSchema,
} from '../schema/workspace-tools.schema';
import { SnippetsService } from 'src/modules/snippets/snippets.service';
import { DocsService } from 'src/modules/docs/docs.service';
import { WorkItemsService } from 'src/modules/work-items/work-items.service';
import type {
  CreateWorkspaceArgs,
  SearchWorkspacesArgs,
  GetWorkspaceOverviewArgs,
} from '../interfaces/tools.interfaces';

@Injectable()
export class WorkspaceToolsHandler {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly snippetsService: SnippetsService,
    private readonly docsService: DocsService,
    private readonly workItemsService: WorkItemsService,
  ) {}

  async handleSearchWorkspaces(args: SearchWorkspacesArgs): Promise<string> {
    const { query } = args;
    const workspaces = await this.workspacesService.getAllWorkspaces(0, 50);
    const filtered = query
      ? workspaces.filter((w) =>
          w.title.toLowerCase().includes(query.toLowerCase()),
        )
      : workspaces;

    if (filtered.length === 0) {
      return `No workspaces found matching "${query}".`;
    }

    const result = filtered.map((w) => ({ id: w.id, title: w.title }));
    return `Found ${filtered.length} workspace(s):\n${JSON.stringify(result)}`;
  }

  async handleGetWorkspaceOverview(workspaceId: string): Promise<string> {
    if (!workspaceId) return 'Workspace ID is required to fetch overview.';

    const [workspace, snippets, workItems, docs] = await Promise.all([
      this.workspacesService.getWorkspace(workspaceId),
      this.snippetsService.getSnippetsByWorkspace(workspaceId),
      this.workItemsService.getWorkItems(workspaceId),
      this.docsService.getDocs(workspaceId),
    ]);

    if (!workspace) return 'Workspace not found.';

    const items = {
      snippets: snippets
        .slice(0, 5)
        .map((s: any) => ({ title: s.title, language: s.language })),
      workItems: workItems
        .slice(0, 5)
        .map((w: any) => ({ title: w.title, status: w.status })),
      docs: docs.slice(0, 5).map((d: any) => ({ label: d.label })),
    };

    let summary = `Workspace: ${workspace.title}\n`;
    if (workspace.description)
      summary += `Description: ${workspace.description}\n`;
    summary += '\nLatest Items:\n';

    if (snippets.length > 0)
      summary += `- ${snippets.length} snippets (e.g., ${items.snippets.map((s) => s.title).join(', ')})\n`;
    if (workItems.length > 0)
      summary += `- ${workItems.length} work items (e.g., ${items.workItems.map((w) => w.title).join(', ')})\n`;
    if (docs.length > 0)
      summary += `- ${docs.length} docs (e.g., ${items.docs.map((d) => d.label).join(', ')})\n`;

    if (snippets.length === 0 && workItems.length === 0 && docs.length === 0) {
      summary +=
        'The workspace currently contains no snippets, work items, or documentation.';
    }

    return summary + '\nFull metadata (top 5 each): ' + JSON.stringify(items);
  }

  async handleCreateWorkspace(
    args: CreateWorkspaceArgs,
    currentWorkspaceId: string,
  ): Promise<string> {
    try {
      const currentWorkspace =
        await this.workspacesService.getWorkspace(currentWorkspaceId);
      if (!currentWorkspace) return 'Current workspace context not found.';

      const newWorkspace = await this.workspacesService.createWorkspace(
        { title: args.title, description: args.description },
        { id: currentWorkspace.ownerId } as any,
      );

      return `Successfully created new workspace: ${newWorkspace.title} (ID: ${newWorkspace.id})`;
    } catch (error) {
      return `Error: Failed to create workspace. Technical details: ${error.message}`;
    }
  }

  getTools(workspaceId: string): DynamicStructuredTool[] {
    const tools: DynamicStructuredTool[] = [];

    tools.push(
      new DynamicStructuredTool({
        name: 'search_workspaces',
        description: 'Search for workspaces by name/title to find their IDs.',
        schema: searchWorkspacesSchema,
        func: (args: SearchWorkspacesArgs) =>
          this.handleSearchWorkspaces(args),
      }),
    );

    tools.push(
      new DynamicStructuredTool({
        name: 'get_workspace_overview',
        description:
          'Fetch a high-level overview of everything in the workspace.',
        schema: getWorkspaceOverviewSchema,
        func: (args: GetWorkspaceOverviewArgs) =>
          this.handleGetWorkspaceOverview(args.workspaceId || workspaceId),
      }),
    );

    tools.push(
      new DynamicStructuredTool({
        name: 'create_workspace',
        description: 'Create a new blank workspace.',
        schema: createWorkspaceSchema,
        func: (args: CreateWorkspaceArgs) =>
          this.handleCreateWorkspace(args, workspaceId),
      }),
    );

    return tools;
  }
}
