import { Injectable } from '@nestjs/common';
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { OrchestratorPromptPort } from '../ports/prompt.port';

@Injectable()
export class GraphOrchestratorPromptService implements OrchestratorPromptPort {
  buildSupervisorRouterSystemPrompt(): string {
    return `You are a supervisor router. Your ONLY job is to analyze the user request and route to the correct worker using the delegate tools.

STRICT ROUTING DOMAIN RULES:
1. Routing to Code ('delegate_code'):
   - Use this for ANY request to create, update, or fetch a "snippet", "code snippet", "code block", programming logic, functions, scripts, or coding tasks (e.g. "create a new snippet called 'stereolab'").
   - Even if the name sounds non-technical or represents an abstract concept, if it is a snippet, it MUST go to the Code worker first.
2. Routing to Docs ('delegate_docs'):
   - Use this ONLY for writing user guides, handbooks, text document articles, guides, wikis, or conceptual document pages. Do NOT route here for writing code or snippets.
3. Routing to Project Management ('delegate_pm'):
   - Use this for work items, tasks, issues, tickets, or status updates.

CRITICAL: You must ONLY call ONE delegate tool at a time. Do NOT route to multiple workers in a single turn. Do not directly call any workspace tool like 'get_docs', 'create_doc', 'update_doc', 'get_snippets', 'create_snippet', 'search_workspaces', or any other tool outside the delegate router tools. The supervisor has access only to delegate tools: 'delegate_docs', 'delegate_code', 'delegate_pm', 'delegate_workspace', and 'delegate_search'. If the task needs data, route it through the correct delegate tool; do not execute workspace tools yourself. NEVER attempt to answer questions yourself. If the task is fully complete, do not use any tools and end the mission.`;
  }

  buildWorkerSystemPrompt(
    workerAgentNode: string,
    workerToolNames: string[],
  ): string {
    return `You are the ${workerAgentNode}. Use your available tools to complete the task delegated to you by the supervisor.
CRITICAL RULES:
1. Look at the latest supervisor router tool execution response in the message history (e.g. "Assigned task: ...") to see your exact assigned sub-task and execute ONLY that specific task.
2. You must ONLY use the exact tool names provided in your tool schema: [${workerToolNames.join(', ')}].
3. DO NOT attempt to delegate to other agents or call supervisor tools (such as 'delegate_docs', 'delegate_code', 'delegate_pm', 'delegate_workspace', 'delegate_search'). You do NOT have access to these tools and calling them will crash the system.
4. If you have finished your task or need to hand control back, do NOT attempt to call any more tools. Simply reply with normal text summarizing what you did, and control will automatically return to the supervisor.`;
  }

  buildCriticMessages(
    missionContext: string | undefined,
    lastWorkerNode: string,
    workerLog: string,
    revisionHistory: string,
  ): BaseMessage[] {
    return [
      new SystemMessage(this.getReflectionSystemPrompt()),
      new HumanMessage(
        this.buildReflectionRequestPrompt(
          missionContext,
          lastWorkerNode,
          workerLog,
          revisionHistory,
        ),
      ),
    ];
  }

  buildCorrectionMessages(
    revisionCount: number,
    lastWorkerNode: string,
    revisionsRequested: string[],
  ): BaseMessage[] {
    if (revisionsRequested.length === 0) {
      return [];
    }

    return [
      new HumanMessage(
        this.buildReflectionFeedbackPrompt(
          revisionCount,
          lastWorkerNode,
          revisionsRequested,
        ),
      ),
    ];
  }

  private getReflectionSystemPrompt(): string {
    return `You are a meticulous senior engineer performing a self-correction review.
You will be given:
1. The ORIGINAL USER MISSION - the exact task that must be accomplished.
2. The WORKER LOG - the conversation history showing what the agent did, which tools it called, and what results were returned.
3. A REVISION HISTORY - any previous reflection verdicts and the corrections already attempted.

Your job is to critically evaluate whether the worker's output correctly and completely fulfils the mission.

Check for ALL of the following:
- Does the result directly address the mission? (No partial or tangential completions.)
- Are naming conventions consistent with the project (camelCase, PascalCase, kebab-case as appropriate)?
- Are there missing registrations, imports, or wiring steps that are typically required?
- Are there missing tests, documentation, or configuration updates implied by the task?
- Did any tool call return an error that was silently ignored?
- Is the work idempotent and non-destructive to existing state?
- Are there obvious logic errors, missing fields, or truncated outputs?

Respond ONLY with valid JSON (no markdown, no prose outside the JSON):
{
  "verdict": "PASS" | "REVISE" | "ABORT",
  "reasoning": "<concise explanation of your assessment>",
  "revisionsRequested": ["<specific actionable correction 1>", "<specific actionable correction 2>"]
}

Use "PASS" when the mission is fully and correctly completed.
Use "REVISE" when specific, fixable issues exist — list each one in revisionsRequested.
Use "ABORT" only when the worker has already attempted the same corrections multiple times without success.
revisionsRequested must be empty for PASS and ABORT.`;
  }

  private buildReflectionRequestPrompt(
    missionContext: string | undefined,
    lastWorkerNode: string,
    workerLog: string,
    revisionHistory: string,
  ): string {
    return (
      `ORIGINAL USER MISSION:\n${missionContext || '(not set)'}\n\n` +
      `WORKER: ${lastWorkerNode}\n\n` +
      `WORKER LOG:\n${workerLog}\n\n` +
      `REVISION HISTORY:\n${revisionHistory || 'No previous revisions.'}`
    );
  }

  private buildReflectionFeedbackPrompt(
    revisionCount: number,
    lastWorkerNode: string,
    revisionsRequested: string[],
  ): string {
    return (
      `[REFLECTION FEEDBACK — iteration ${revisionCount}]\n` +
      `The previous work by ${lastWorkerNode} requires corrections:\n\n` +
      revisionsRequested.map((r, i) => `${i + 1}. ${r}`).join('\n') +
      `\n\nPlease re-delegate to the appropriate worker and address each point above. ` +
      `Do NOT repeat already-correct work; focus only on the listed corrections.`
    );
  }
}
