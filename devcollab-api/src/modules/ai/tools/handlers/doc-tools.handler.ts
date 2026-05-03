import { Injectable } from '@nestjs/common';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { DocsService } from 'src/modules/docs/docs.service';
import {
  createDocSchema,
  getDocsSchema,
  updateDocSchema,
} from '../schema/doc-tools.schema';
import type {
  CreateDocArgs,
  GetDocsArgs,
  UpdateDocArgs,
} from '../interfaces/tools.interfaces';

@Injectable()
export class DocToolsHandler {
  constructor(private readonly docsService: DocsService) { }

  private safeParseContent(content: unknown): string {
    if (typeof content === 'string') return content;
    try {
      return JSON.stringify(content);
    } catch {
      return String(content);
    }
  }

  async handleGetDocs(args: GetDocsArgs, defaultId: string): Promise<string> {
    const { labelFilter, workspaceId: overrideId } = args;
    const workspaceId = overrideId || defaultId;
    if (!workspaceId) return 'Workspace ID is required to fetch docs.';

    const docs = labelFilter
      ? await this.docsService.searchDocs(workspaceId, labelFilter, 20)
      : await this.docsService.getDocs(workspaceId);

    if (docs.length === 0) {
      return labelFilter
        ? `No documentation found matching the label: '${labelFilter}'.`
        : 'No documentation documents have been found.';
    }

    const output = docs.map((d) => ({
      id: d.id,
      label: d.label,
      content: this.safeParseContent(d.content).slice(0, 400) + '...',
    }));
    return `Found exactly ${docs.length} doc(s) total in the workspace.\n${JSON.stringify(output)}`;
  }

  async handleCreateDoc(
    args: CreateDocArgs,
    defaultId: string,
  ): Promise<string> {
    const workspaceId = args.workspaceId || defaultId;
    try {
      const doc = await this.docsService.createDoc({
        label: args.label,
        content: args.content,
        workspaceId,
      });
      return `Successfully created documentation: ${doc.label} (ID: ${doc.id})`;
    } catch (error) {
      return `Error: Failed to create documentation. Technical details: ${error.message}`;
    }
  }

  async handleUpdateDoc(args: UpdateDocArgs): Promise<string> {
    try {
      const doc = await this.docsService.updateDoc(args);
      return `Successfully updated documentation: ${doc.label}`;
    } catch (error) {
      return `Error: Failed to update documentation. Technical details: ${error.message}`;
    }
  }

  getTools(workspaceId: string): DynamicStructuredTool[] {
    const tools: DynamicStructuredTool[] = [];

    tools.push(
      new DynamicStructuredTool<any>({
        name: 'get_docs',
        description:
          'Fetch ALL documentation records in a workspace. Optionally filter by label.',
        schema: getDocsSchema as any,
        func: (args: GetDocsArgs) => this.handleGetDocs(args, workspaceId),
      }),
    );

    tools.push(
      new DynamicStructuredTool<any>({
        name: 'create_doc',
        description: 'Create a new documentation document.',
        schema: createDocSchema as any,
        func: (args: CreateDocArgs) => this.handleCreateDoc(args, workspaceId),
      }),
    );

    tools.push(
      new DynamicStructuredTool<any>({
        name: 'update_doc',
        description:
          'Update the content of an existing documentation document.',
        schema: updateDocSchema as any,
        func: (args: UpdateDocArgs) => this.handleUpdateDoc(args),
      }),
    );

    return tools;
  }
}
