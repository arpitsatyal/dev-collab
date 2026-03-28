import { Injectable } from '@nestjs/common';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ToolRegistry } from '../ports/tool.port';
import { SnippetRepository } from 'src/modules/snippets/repositories/snippet.repository';
import { DocRepository } from 'src/modules/docs/repositories/doc.repository';
import { WorkItemRepository } from 'src/modules/work-items/repositories/work-item.repository';
import { WorkspacesService } from 'src/modules/workspaces/workspaces.service';

@Injectable()
export class ToolService implements ToolRegistry {
  constructor(
    private readonly snippetRepo: SnippetRepository,
    private readonly docRepo: DocRepository,
    private readonly workItemRepo: WorkItemRepository,
    private readonly workspacesService: WorkspacesService,
  ) { }

  private safeParseContent(content: unknown): string {
    if (typeof content === 'string') return content;
    try {
      return JSON.stringify(content);
    } catch {
      return String(content);
    }
  }

  private async handleGetSnippets(
    { titleFilter }: { titleFilter?: string },
    workspaceId: string,
  ): Promise<string> {
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
    { labelFilter }: { labelFilter?: string },
    workspaceId: string,
  ): Promise<string> {
    if (!workspaceId) return 'Workspace ID is required to fetch docs.';

    const docs = labelFilter
      ? await this.docRepo.findManyByLabel(workspaceId, labelFilter, 20)
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
    { titleFilter }: { titleFilter?: string },
    workspaceId: string,
  ): Promise<string> {
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
    { query }: { query: string },
    workspaceId: string,
  ): Promise<string> {
    if (!workspaceId) return 'Workspace ID is required to run semantic search.';

    const snippets = await this.snippetRepo.findManyBySearch(workspaceId, query, 3);
    const workItems = await this.workItemRepo.findManyBySearch(workspaceId, query, 3);
    const docs = await this.docRepo.findManyByLabel(workspaceId, query, 3);

    if (snippets.length === 0 && workItems.length === 0 && docs.length === 0) {
      return 'No relevant content found for that query.';
    }

    return JSON.stringify({ snippets, workItems, docs });
  }

  private async handleGetWorkspaceOverview(workspaceId: string): Promise<string> {
    if (!workspaceId) return 'Workspace ID is required to fetch overview.';

    const [workspace, snippets, workItems, docs] = await Promise.all([
      this.workspacesService.getWorkspace(workspaceId),
      this.snippetRepo.findByWorkspaceId(workspaceId, 5),
      this.workItemRepo.findByWorkspaceId(workspaceId, 5),
      this.docRepo.findByWorkspaceId(workspaceId, 5),
    ]);

    const items = {
      snippets: snippets.map((s: any) => ({ title: s.title, language: s.language })),
      workItems: workItems.map((w: any) => ({ title: w.title, status: w.status })),
      docs: docs.map((d: any) => ({ label: d.label })),
    };

    const hasContent = snippets.length > 0 || workItems.length > 0 || docs.length > 0;

    let summary = `Workspace: ${workspace.title}\n`;
    if (workspace.description) summary += `Description: ${workspace.description}\n`;
    summary += '\nLatest Items:\n';

    if (snippets.length > 0) summary += `- ${snippets.length} snippets (e.g., ${items.snippets.map(s => s.title).join(', ')})\n`;
    if (workItems.length > 0) summary += `- ${workItems.length} work items (e.g., ${items.workItems.map(w => w.title).join(', ')})\n`;
    if (docs.length > 0) summary += `- ${docs.length} docs (e.g., ${items.docs.map(d => d.label).join(', ')})\n`;

    if (!hasContent) {
      summary += 'The workspace currently contains no snippets, work items, or documentation.';
    }

    return summary + '\nFull metadata (top 5 each): ' + JSON.stringify(items);
  }

  getToolsForWorkspace(workspaceId: string) {
    const snippetsTool = new DynamicStructuredTool({
      name: 'getSnippets',
      description: 'Fetch ALL code snippets in the workspace. Optionally filter by title keywords.',
      schema: z.object({
        titleFilter: z.string().optional().describe('Keyword to filter snippets by title (e.g., "auth" or "utils"). Leave blank to fetch all.'),
      }),
      func: (args) => this.handleGetSnippets(args, workspaceId),
    } as any);

    const docsTool = new DynamicStructuredTool({
      name: 'getDocs',
      description: 'Fetch ALL documentation records in the workspace. Optionally filter by label.',
      schema: z.object({
        labelFilter: z.string().optional().describe('Label to filter docs (e.g., "manual" or "design-doc"). Leave blank to fetch all documents.'),
      }),
      func: (args) => this.handleGetDocs(args, workspaceId),
    } as any);

    const existingWorkItemsTool = new DynamicStructuredTool({
      name: 'getWorkItems',
      description: 'Fetch ALL work items (tasks/tickets) inside the current workspace. Optionally filter by title.',
      schema: z.object({
        titleFilter: z.string().optional().describe('Search keyword to filter work item titles. Leave blank to fetch all work items in the workspace.'),
      }),
      func: (args) => this.handleGetWorkItems(args, workspaceId),
    } as any);

    const semanticSearchTool = new DynamicStructuredTool({
      name: 'semanticSearch',
      description: 'Perform a broad semantic search across snippets, docs, and work items simultaneously.',
      schema: z.object({
        searchQuery: z.string().describe('The natural language search query or concept to look for (e.g. "how do we handle errors?").'),
      }),
      func: (args) => this.handleSemanticSearch({ query: args.searchQuery }, workspaceId),
    } as any);

    const overviewTool = new DynamicStructuredTool({
      name: 'getWorkspaceOverview',
      description: 'Fetch a high-level overview of everything in the workspace. Best for "what is this about?", "summarize the workspace", or when you need a general status report.',
      schema: z.object({}), // No parameters needed
      func: () => this.handleGetWorkspaceOverview(workspaceId),
    } as any);

    const list: DynamicStructuredTool[] = [
      snippetsTool,
      docsTool,
      existingWorkItemsTool,
      semanticSearchTool,
      overviewTool,
    ];

    return { list };
  }
}
