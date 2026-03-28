import { Injectable } from '@nestjs/common';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { workspaces, workItems } from 'src/common/drizzle/schema';
import { eq } from 'drizzle-orm';
import { LlmGateway } from '../ports/llm.port';

@Injectable()
export class SuggestionService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly llmFactory: LlmGateway,
  ) { }

  async suggestWorkItems(workspaceId: string | undefined) {
    const workspace = await this.drizzle.db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId!),
      with: {
        snippets: { limit: 5 },
        docs: { limit: 5 },
        workItems: { limit: 5 },
      },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

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
- title
- description
- suggestedStatus (TODO | IN_PROGRESS | DONE)
- tags (array of strings)
  `;

    const output = await llm.pipe(new StringOutputParser()).invoke(prompt);
    try {
      return JSON.parse(output);
    } catch {
      return [];
    }
  }

  async suggestSnippetFilenameForCode(params: {
    workspaceId: string | undefined;
    code: string;
    language?: string;
  }) {
    const { code, language, workspaceId } = params;

    const workspace = await this.drizzle.db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId!),
      columns: { title: true, description: true },
    });

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

  async generateImplementationPlan(workItemId: string | undefined) {
    const workItem = await this.drizzle.db.query.workItems.findFirst({
      where: eq(workItems.id, workItemId!),
      with: {
        workspace: true,
        snippets: {
          limit: 5,
          with: {
            snippet: true,
          },
        },
      },
    });

    if (!workItem) {
      throw new Error('Work item not found');
    }

    const llm = await this.llmFactory.getReasoningLLM();
    const prompt = `
You are helping break down a work item into a concise implementation plan.
Work Item: ${workItem.title}
Status: ${workItem.status}
Description: ${workItem.description || 'No description'}
Workspace: ${workItem.workspace.title}
Related snippets:
${workItem.snippets.map((s: any) => `- ${s.snippet.title} (${s.snippet.language})`).join('\n') || 'None'}

Return a JSON object with:
- summary: short overview
- steps: array of { title, detail }
- risks: array of strings
- estimated_effort: string (e.g., "2-3 days")
`;

    const planText = await llm.pipe(new StringOutputParser()).invoke(prompt);
    try {
      return JSON.parse(planText);
    } catch {
      return { summary: planText, steps: [], risks: [], estimated_effort: '' };
    }
  }
}
