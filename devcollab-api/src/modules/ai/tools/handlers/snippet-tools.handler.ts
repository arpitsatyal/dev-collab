import { Injectable } from '@nestjs/common';
import { IAiTool } from '../ports/tools.port';
import { SnippetsService } from 'src/modules/snippets/snippets.service';
import {
  createSnippetSchema,
  getSnippetsSchema,
} from '../schema/snippet-tools.schema';
import type {
  CreateSnippetArgs,
  GetSnippetsArgs,
} from '../types/tools.types';

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

  async handleGetSnippets(
    args: GetSnippetsArgs,
    defaultId: string,
  ): Promise<string> {
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

  async handleCreateSnippet(
    args: CreateSnippetArgs,
    defaultId: string,
    authorId: string,
  ): Promise<string> {
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

  getTools(workspaceId: string, authorId: string): IAiTool[] {
    const tools: IAiTool[] = [];

    tools.push({
      name: 'get_snippets',
      description:
        'Fetch ALL code snippets in a workspace. Optionally filter by title keywords.',
      schema: getSnippetsSchema,
      invoke: (args: GetSnippetsArgs) => this.handleGetSnippets(args, workspaceId),
    });

    tools.push({
      name: 'create_snippet',
      description: 'Create a new code snippet.',
      schema: createSnippetSchema,
      invoke: (args: CreateSnippetArgs) =>
        this.handleCreateSnippet(args, workspaceId, authorId),
    });

    return tools;
  }
}
