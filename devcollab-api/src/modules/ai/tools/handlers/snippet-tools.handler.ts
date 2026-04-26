import { Injectable } from '@nestjs/common';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { SnippetsService } from 'src/modules/snippets/snippets.service';
import { CreateSnippetArgs, GetSnippetsArgs } from '../types/tools.types';

@Injectable()
export class SnippetToolsHandler {
  constructor(private readonly snippetsService: SnippetsService) {}

  private safeParseContent(content: unknown): string {
    if (typeof content === 'string') return content;
    try {
      return JSON.stringify(content);
    } catch {
      return String(content);
    }
  }

  async handleGetSnippets(args: GetSnippetsArgs, defaultId: string): Promise<string> {
    const { titleFilter, workspaceId: overrideId } = args;
    const workspaceId = overrideId || defaultId;
    if (!workspaceId) return 'Workspace ID is required to fetch snippets.';

    const snippets = titleFilter
      ? await this.snippetsService.searchSnippets(workspaceId, titleFilter, 20)
      : await this.snippetsService.getSnippetsByWorkspace(workspaceId);

    if (snippets.length === 0) {
      return titleFilter
        ? `No code snippets found matching the title or keywords: '${titleFilter}'.`
        : 'No code snippets have been created yet.';
    }

    const output = snippets.map((s) => ({
      id: s.id,
      title: s.title,
      language: s.language,
      content: this.safeParseContent(s.content).slice(0, 400) + '...',
    }));
    return `Found exactly ${snippets.length} snippet(s) total in the workspace.\n${JSON.stringify(output)}`;
  }

  async handleCreateSnippet(args: CreateSnippetArgs, defaultId: string, authorId: string): Promise<string> {
    const workspaceId = args.workspaceId || defaultId;
    try {
      const snippet = await this.snippetsService.createSnippet({
        title: args.title,
        language: args.language,
        content: args.content,
        extension: args.extension,
        workspaceId,
        authorId,
      });
      return `Successfully created snippet: ${snippet.title} (ID: ${snippet.id})`;
    } catch (error) {
      return `Error: Failed to create snippet. Technical details: ${error.message}`;
    }
  }

  getTools(workspaceId: string, authorId: string): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: 'get_snippets',
        description: 'Fetch ALL code snippets in a workspace. Optionally filter by title keywords.',
        schema: z.object({
          titleFilter: z.string().optional().describe('Keyword to filter snippets by title.'),
          workspaceId: z.string().optional().describe('Target workspace ID.'),
        }),
        func: (args) => this.handleGetSnippets(args, workspaceId),
      }),
      new DynamicStructuredTool({
        name: 'create_snippet',
        description: 'Create a new code snippet.',
        schema: z.object({
          title: z.string().describe('Title of the snippet'),
          language: z.string().describe('Programming language'),
          content: z.string().describe('Code content'),
          extension: z.string().optional().describe('File extension (e.g., ".ts")'),
          workspaceId: z.string().optional().describe('Target workspace ID.'),
        }),
        func: (args) => this.handleCreateSnippet(args, workspaceId, authorId),
      }),
    ];
  }
}
