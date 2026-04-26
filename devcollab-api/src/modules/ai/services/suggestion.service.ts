import { Injectable, NotFoundException } from '@nestjs/common';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { WorkspaceRepository } from '../../workspaces/adapters/workspace.repository';
import { WorkItemRepository } from '../../work-items/repositories/work-item.repository';
import { LlmGateway } from '../ports/llm.port';
import {
  AnalyzeWorkItemRequest,
  SuggestSnippetFilenameRequest,
  SuggestWorkItemsRequest,
} from '../types/ai.types';

@Injectable()
export class SuggestionService {
  constructor(
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly workItemRepo: WorkItemRepository,
    private readonly llmFactory: LlmGateway,
  ) { }

  private async getWorkspaceWithContext(workspaceId: string) {
    const workspace = await this.workspaceRepo.findByIdWithContext(workspaceId);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  private parseJsonResponse<T>(text: string, fallback: T): T {
    try {
      // Find JSON block within markdown if it exists
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonToParse = jsonMatch ? jsonMatch[1].trim() : text.trim();

      return JSON.parse(jsonToParse) as T;
    } catch {
      return fallback;
    }
  }

  async suggestWorkItems(request: SuggestWorkItemsRequest) {
    const { workspaceId } = request;
    const workspace = await this.getWorkspaceWithContext(workspaceId);
    const llm = await this.llmFactory.getReasoningLLM();

    const prompt = `
You are an AI assistant helping to propose actionable work items for a software workspace.
Workspace title: ${workspace.title}
Workspace description: ${workspace.description || 'No description'}

Existing work items:
${workspace.workItems.map((w: any) => `- ${w.title} [${w.status}]`).join('\n') || 'None'}

Recent snippets:
${workspace.snippets.map((s: any) => `- ${s.title} (${s.language})`).join('\n') || 'None'}

Docs:
${workspace.docs.map((d: any) => `- ${d.label}`).join('\n') || 'None'}

Return 3 concrete work items with a short rationale. Respond in JSON array with fields:
- title: Concise title
- description: Short description and rationale
- suggestedStatus: (TODO | IN_PROGRESS | DONE)
- tags: Array of short strings (e.g., ["api", "ui"])
- priority: (HIGH | MEDIUM | LOW)
- category: Short area name (e.g., "Frontend", "Backend", "Security")
  `;

    const output = await llm.pipe(new StringOutputParser()).invoke(prompt);
    return this.parseJsonResponse<any[]>(output, []);
  }

  async suggestSnippetFilenameForCode(request: SuggestSnippetFilenameRequest) {
    const { code, language, workspaceId } = request;

    const workspace = await this.workspaceRepo.findById(workspaceId);

    const llm = await this.llmFactory.getSpeedyLLM();
    const prompt = `
You are generating a concise filename for a code snippet inside workspace "${workspace?.title}".
Language: ${language || 'unknown'}
Workspace description: ${workspace?.description || 'N/A'}

Code:
${code.substring(0, 4000)}

Respond with a single filename (no extension) using kebab-case. Keep it under 40 characters.
`;

    const name = await llm.pipe(new StringOutputParser()).invoke(prompt);
    return name.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
  }

  async generateImplementationPlan(request: AnalyzeWorkItemRequest) {
    const { workItemId } = request;
    const workItem = await this.workItemRepo.findById(workItemId);

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    const llm = await this.llmFactory.getReasoningLLM();
    const prompt = `
You are helping break down a work item into a concise implementation plan.
Work Item: ${workItem.title}
Status: ${workItem.status}
Description: ${workItem.description || 'No description'}
Workspace: ${workItem.workspace.title}
Related snippets:
${workItem.snippets?.map((s: any) => `- ${s.snippet.title} (${s.snippet.language})`).join('\n') || 'None'}

Return a JSON object with:
- summary: short overview
- steps: array of { title, detail }
- risks: array of strings
- estimated_effort: string (e.g., "2-3 days")
`;

    const planText = await llm.pipe(new StringOutputParser()).invoke(prompt);
    return this.parseJsonResponse<Record<string, any>>(planText, {
      summary: planText,
      steps: [],
      risks: [],
      estimated_effort: '',
    });
  }
}
