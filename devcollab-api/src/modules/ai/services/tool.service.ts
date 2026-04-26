import { Injectable } from '@nestjs/common';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ToolRegistry } from '../ports/tool.port';
import { SnippetRepository } from 'src/modules/snippets/repositories/snippet.repository';
import { DocRepository } from 'src/modules/docs/repositories/doc.repository';
import { WorkItemRepository } from 'src/modules/work-items/repositories/work-item.repository';
import { WorkspaceRepository } from 'src/modules/workspaces/adapters/workspace.repository';
import { WorkspaceActionsPort } from 'src/common/ports/workspace-actions.port';
import { v4 as uuid } from 'uuid';
import {
  CreateDocArgs,
  CreateSnippetArgs,
  CreateWorkItemArgs,
  CreateWorkspaceArgs,
  GetDocsArgs,
  GetSnippetsArgs,
  GetWorkItemsArgs,
  SearchWorkspacesArgs,
  SemanticSearchArgs,
  UpdateDocArgs,
  UpdateWorkItemArgs,
} from '../types/ai-tools.types';

@Injectable()
export class ToolService implements ToolRegistry {
  constructor(
    private readonly snippetRepo: SnippetRepository,
    private readonly docRepo: DocRepository,
    private readonly workItemRepo: WorkItemRepository,
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly workspaceActions: WorkspaceActionsPort,
  ) { }

  private safeParseContent(content: unknown): string {
    if (typeof content === 'string') return content;
    try {
      return JSON.stringify(content);
    } catch {
      return String(content);
    }
  }

  private async handleSearchWorkspaces(
    args: SearchWorkspacesArgs,
  ): Promise<string> {
    const { query } = args;
    const workspaces = await this.workspaceRepo.findPaginated(0, 50);
    const filtered = query
      ? workspaces.filter(w => w.title.toLowerCase().includes(query.toLowerCase()))
      : workspaces;

    if (filtered.length === 0) {
      return `No workspaces found matching "${query}".`;
    }

    const result = filtered.map(w => ({ id: w.id, title: w.title }));
    return `Found ${filtered.length} workspace(s):\n${JSON.stringify(result)}`;
  }

  private async handleGetSnippets(
    args: GetSnippetsArgs,
    defaultId: string,
  ): Promise<string> {
    const { titleFilter, workspaceId: overrideId } = args;
    const workspaceId = overrideId || defaultId;
    if (!workspaceId) return 'Workspace ID is required to fetch snippets.';

    const snippets = titleFilter
      ? await this.snippetRepo.findManyBySearch(workspaceId, titleFilter, 20)
      : await this.snippetRepo.findByWorkspaceId(workspaceId, 100);

    if (snippets.length === 0) {
      return titleFilter
        ? `No code snippets found matching the title or keywords: '${titleFilter}'.`
        : 'No code snippets have been created yet.';
    }

    const output = snippets.map((s) => ({
      title: (s as any).title,
      language: (s as any).language,
      content: this.safeParseContent((s as any).content).slice(0, 400) + '...',
    }));
    return `Found exactly ${snippets.length} snippet(s) total in the workspace.\n${JSON.stringify(output)}`;
  }

  private async handleGetDocs(
    args: GetDocsArgs,
    defaultId: string,
  ): Promise<string> {
    const { labelFilter, workspaceId: overrideId } = args;
    const workspaceId = overrideId || defaultId;
    if (!workspaceId) return 'Workspace ID is required to fetch docs.';

    const docs = labelFilter
      ? await this.docRepo.findManyBySearch(workspaceId, labelFilter, 20)
      : await this.docRepo.findByWorkspaceId(workspaceId, 100);

    if (docs.length === 0) {
      return labelFilter
        ? `No documentation found matching the label: '${labelFilter}'.`
        : 'No documentation documents have been found.';
    }

    const output = docs.map((d) => ({
      label: d.label,
      content: this.safeParseContent(d.content).slice(0, 400) + '...',
    }));
    return `Found exactly ${docs.length} doc(s) total in the workspace.\n${JSON.stringify(output)}`;
  }

  private async handleGetWorkItems(
    args: GetWorkItemsArgs,
    defaultId: string,
  ): Promise<string> {
    const { titleFilter, workspaceId: overrideId } = args;
    const workspaceId = overrideId || defaultId;
    if (!workspaceId) return 'Workspace ID is required to fetch work items.';

    const workItems = titleFilter
      ? await this.workItemRepo.findManyBySearch(workspaceId, titleFilter, 20)
      : await this.workItemRepo.findByWorkspaceId(workspaceId, 100);

    if (workItems.length === 0) {
      return titleFilter
        ? `No work items found matching the title: '${titleFilter}'.`
        : 'No work items have been created yet.';
    }

    const output = workItems.map((w: any) => ({
      title: w.title,
      description: w.description || '',
      status: w.status,
    }));
    return `Found exactly ${workItems.length} work item(s) total in the workspace.\n${JSON.stringify(output)}`;
  }

  private async handleSemanticSearch(
    args: SemanticSearchArgs,
    defaultId: string,
  ): Promise<string> {
    const { query, workspaceId: overrideId } = args;
    const workspaceId = overrideId || defaultId;
    if (!workspaceId) return 'Workspace ID is required to run semantic search.';

    const [snippets, workItems, docs] = await Promise.all([
      this.snippetRepo.findManyBySearch(workspaceId, query, 3),
      this.workItemRepo.findManyBySearch(workspaceId, query, 3),
      this.docRepo.findManyBySearch(workspaceId, query, 3),
    ]);

    if (snippets.length === 0 && workItems.length === 0 && docs.length === 0) {
      return 'No relevant content found for that query.';
    }

    return JSON.stringify({ snippets, workItems, docs });
  }

  private async handleGetWorkspaceOverview(
    workspaceId: string,
  ): Promise<string> {
    if (!workspaceId) return 'Workspace ID is required to fetch overview.';

    const [workspace, snippets, workItems, docs] = await Promise.all([
      this.workspaceRepo.findById(workspaceId),
      this.snippetRepo.findByWorkspaceId(workspaceId, 5),
      this.workItemRepo.findByWorkspaceId(workspaceId, 5),
      this.docRepo.findByWorkspaceId(workspaceId, 5),
    ]);

    if (!workspace) return 'Workspace not found.';

    const items = {
      snippets: snippets.map((s: any) => ({
        title: s.title,
        language: s.language,
      })),
      workItems: workItems.map((w: any) => ({
        title: w.title,
        status: w.status,
      })),
      docs: docs.map((d: any) => ({ label: d.label })),
    };

    const hasContent =
      snippets.length > 0 || workItems.length > 0 || docs.length > 0;

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

    if (!hasContent) {
      summary +=
        'The workspace currently contains no snippets, work items, or documentation.';
    }

    return summary + '\nFull metadata (top 5 each): ' + JSON.stringify(items);
  }

  private async handleCreateSnippet(
    args: CreateSnippetArgs,
    defaultId: string,
  ): Promise<string> {
    const workspaceId = args.workspaceId || defaultId;
    try {
      const snippet = await this.snippetRepo.create({
        title: args.title,
        language: args.language,
        content: args.content,
        workspaceId,
      });
      return `Successfully created snippet: ${snippet.title} (ID: ${snippet.id})`;
    } catch (error) {
      return `Error: Failed to create snippet. Technical details: ${error.message}`;
    }
  }

  private async handleCreateWorkItem(
    args: CreateWorkItemArgs,
    defaultId: string,
  ): Promise<string> {
    const workspaceId = args.workspaceId || defaultId;
    const workItem = await this.workItemRepo.create({
      title: args.title,
      description: args.description,
      status: (args.status as any) || 'TODO',
      workspaceId,
    });
    return `Successfully created work item: ${workItem.title} (ID: ${workItem.id})`;
  }

  private async handleUpdateWorkItem(
    args: UpdateWorkItemArgs,
  ): Promise<string> {
    const workItem = await this.workItemRepo.update(args.id, {
      ...args,
      status: args.status as any,
    });
    return `Successfully updated work item: ${workItem.title}`;
  }

  private async handleCreateDoc(
    args: CreateDocArgs,
    defaultId: string,
  ): Promise<string> {
    const workspaceId = args.workspaceId || defaultId;
    const doc = await this.docRepo.create({
      label: args.label,
      content: args.content,
      workspaceId,
      roomId: uuid(),
    });
    return `Successfully created documentation: ${doc.label} (ID: ${doc.id})`;
  }

  private async handleUpdateDoc(
    args: UpdateDocArgs,
  ): Promise<string> {
    const doc = await this.docRepo.update(args.id, {
      content: args.content,
    });
    return `Successfully updated documentation: ${doc.label}`;
  }

  private async handleCreateWorkspace(
    args: CreateWorkspaceArgs,
    currentWorkspaceId: string,
  ): Promise<string> {
    try {
      const currentWorkspace =
        await this.workspaceRepo.findById(currentWorkspaceId);
      if (!currentWorkspace) return 'Current workspace context not found.';

      const ownerId = currentWorkspace.ownerId;

      const newWorkspace = await this.workspaceActions.createWorkspace(
        {
          title: args.title,
          description: args.description,
        },
        { id: ownerId },
      );

      return `Successfully created new workspace: ${newWorkspace.title} (ID: ${newWorkspace.id})`;
    } catch (error) {
      return `Error: Failed to create workspace. Technical details: ${error.message}`;
    }
  }

  getToolsForWorkspace(workspaceId: string) {
    const searchWorkspacesTool = new DynamicStructuredTool({
      name: 'searchWorkspaces',
      description: 'Search for workspaces by name/title to find their IDs.',
      schema: z.object({
        query: z.string().optional().describe('Part of the workspace name to look for.'),
      }),
      func: (args) => this.handleSearchWorkspaces(args),
    } as any);

    const snippetsTool = new DynamicStructuredTool({
      name: 'getSnippets',
      description:
        'Fetch ALL code snippets in a workspace. Optionally filter by title keywords.',
      schema: z.object({
        titleFilter: z
          .string()
          .optional()
          .describe(
            'Keyword to filter snippets by title (e.g., "auth" or "utils").',
          ),
        workspaceId: z.string().optional().describe('Target workspace ID. Omit to use current.'),
      }),
      func: (args) => this.handleGetSnippets(args, workspaceId),
    } as any);

    const docsTool = new DynamicStructuredTool({
      name: 'getDocs',
      description:
        'Fetch ALL documentation records in a workspace. Optionally filter by label.',
      schema: z.object({
        labelFilter: z
          .string()
          .optional()
          .describe(
            'Label to filter docs (e.g., "manual" or "design-doc").',
          ),
        workspaceId: z.string().optional().describe('Target workspace ID. Omit to use current.'),
      }),
      func: (args) => this.handleGetDocs(args, workspaceId),
    } as any);

    const existingWorkItemsTool = new DynamicStructuredTool({
      name: 'getWorkItems',
      description:
        'Fetch ALL work items inside a workspace. Optionally filter by title.',
      schema: z.object({
        titleFilter: z
          .string()
          .optional()
          .describe(
            'Search keyword to filter work item titles.',
          ),
        workspaceId: z.string().optional().describe('Target workspace ID. Omit to use current.'),
      }),
      func: (args) => this.handleGetWorkItems(args, workspaceId),
    } as any);

    const semanticSearchTool = new DynamicStructuredTool({
      name: 'semanticSearch',
      description:
        'Perform a broad semantic search across snippets, docs, and work items.',
      schema: z.object({
        searchQuery: z
          .string()
          .describe(
            'The natural language search query.',
          ),
        workspaceId: z.string().optional().describe('Target workspace ID. Omit to use current.'),
      }),
      func: (args) =>
        this.handleSemanticSearch({ query: args.searchQuery, workspaceId: args.workspaceId }, workspaceId),
    } as any);

    const overviewTool = new DynamicStructuredTool({
      name: 'getWorkspaceOverview',
      description:
        'Fetch a high-level overview of everything in the workspace. Best for "what is this about?", "summarize the workspace", or when you need a general status report.',
      schema: z.object({}), // No parameters needed
      func: () => this.handleGetWorkspaceOverview(workspaceId),
    } as any);

    const createSnippetTool = new DynamicStructuredTool({
      name: 'createSnippet',
      description: 'Create a new code snippet.',
      schema: z.object({
        title: z.string().describe('Title of the snippet'),
        language: z.string().describe('Programming language'),
        content: z.string().describe('Code content'),
        workspaceId: z.string().optional().describe('Target workspace ID. Omit to use current.'),
      }),
      func: (args) => this.handleCreateSnippet(args, workspaceId),
    } as any);

    const createWorkItemTool = new DynamicStructuredTool({
      name: 'createWorkItem',
      description: 'Create a new task or work item.',
      schema: z.object({
        title: z.string().describe('Task title'),
        description: z.string().optional().describe('Task detail'),
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
        workspaceId: z.string().optional().describe('Target workspace ID. Omit to use current.'),
      }),
      func: (args) => this.handleCreateWorkItem(args, workspaceId),
    } as any);

    const updateWorkItemTool = new DynamicStructuredTool({
      name: 'updateWorkItem',
      description: 'Update an existing work item status, title, or description.',
      schema: z.object({
        id: z.string().describe('The ID of the work item to update'),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
      }),
      func: (args) => this.handleUpdateWorkItem(args),
    } as any);

    const createDocTool = new DynamicStructuredTool({
      name: 'createDoc',
      description: 'Create a new documentation document.',
      schema: z.object({
        label: z.string().describe('Label or title of the doc'),
        content: z.any().optional(),
        workspaceId: z.string().optional().describe('Target workspace ID. Omit to use current.'),
      }),
      func: (args) => this.handleCreateDoc(args, workspaceId),
    } as any);

    const createWorkspaceTool = new DynamicStructuredTool({
      name: 'createWorkspace',
      description: 'Create a new blank workspace.',
      schema: z.object({
        title: z.string().describe('Title of the new workspace'),
        description: z.string().optional().describe('Optional description'),
      }),
      func: (args) => this.handleCreateWorkspace(args, workspaceId),
    } as any);

    const updateDocTool = new DynamicStructuredTool({
      name: 'updateDoc',
      description: 'Update the content of an existing documentation document.',
      schema: z.object({
        id: z.string().describe('The ID of the document to update'),
        content: z.any().describe('The new content for the document'),
      }),
      func: (args) => this.handleUpdateDoc(args),
    } as any);

    const list: DynamicStructuredTool[] = [
      searchWorkspacesTool,
      snippetsTool,
      docsTool,
      existingWorkItemsTool,
      semanticSearchTool,
      overviewTool,
      createSnippetTool,
      createWorkItemTool,
      updateWorkItemTool,
      createDocTool,
      updateDocTool,
      createWorkspaceTool,
    ];

    return { list };
  }
}
