import { Injectable, Logger } from '@nestjs/common';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentRunnableConfig } from '../types/orchestrator.types';
import { GraphState, ReflectionEntry, ReflectionVerdict } from '../state/graph.state';
import { ToolBoundLlm } from 'src/modules/ai/llm/llm.types';
import { EventBusService } from 'src/common/events/event-bus.service';
import { AgentActionType } from 'src/common/events/agent-events.enums';
import { OrchestratorStateUtils } from '../utils/orchestrator-state.utils';

/** Maximum reflection cycles before the graph is forced to move on. */
export const MAX_REFLECTION_RETRIES = 3;

const REFLECTION_SYSTEM_PROMPT = `You are a meticulous senior engineer performing a self-correction review.
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

@Injectable()
export class GraphReflectionService {
  private readonly logger = new Logger(GraphReflectionService.name);

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Reflection node implementation.
   *
   * Evaluates the output of the most-recently-completed worker agent against
   * the original mission. Returns a structured verdict and, when revisions are
   * needed, injects a HumanMessage containing the correction instructions so
   * the supervisor will re-delegate with full context.
   */
  async reflect(
    state: typeof GraphState.State,
    llm: ToolBoundLlm,
    config: AgentRunnableConfig,
  ): Promise<Partial<typeof GraphState.State>> {
    const { missionContext, reflectionCount, reflectionLog, lastWorkerNode, messages } = state;

    this.eventBus.emitAgentAction(
      config.configurable || {},
      AgentActionType.REFLECTION_START,
      `Reflecting on ${lastWorkerNode} output (attempt ${reflectionCount + 1}/${MAX_REFLECTION_RETRIES})`,
    );

    // ── 1. Hard-stop: never exceed MAX_REFLECTION_RETRIES ──────────────────
    if (reflectionCount >= MAX_REFLECTION_RETRIES) {
      this.logger.warn(
        `[Reflection] Max retries (${MAX_REFLECTION_RETRIES}) reached for worker "${lastWorkerNode}". Forcing ABORT.`,
      );
      const abortEntry = this.buildEntry(state, 'ABORT', 'Maximum reflection retries reached. Proceeding with best-effort result.', []);
      this.eventBus.emitAgentAction(
        config.configurable || {},
        AgentActionType.REFLECTION_END,
        `Reflection ABORT — retry limit hit`,
      );
      return {
        reflectionCount: reflectionCount + 1,
        reflectionLog: [abortEntry],
      };
    }

    // ── 2. Build the critic prompt ──────────────────────────────────────────
    const workerLog = this.buildWorkerLog(messages, lastWorkerNode);
    const revisionHistory = this.buildRevisionHistory(reflectionLog, lastWorkerNode);

    const criticMessages: BaseMessage[] = [
      new SystemMessage(REFLECTION_SYSTEM_PROMPT),
      new HumanMessage(
        `ORIGINAL USER MISSION:\n${missionContext || '(not set)'}\n\n` +
          `WORKER: ${lastWorkerNode}\n\n` +
          `WORKER LOG:\n${workerLog}\n\n` +
          `REVISION HISTORY:\n${revisionHistory || 'No previous revisions.'}`,
      ),
    ];

    // ── 3. Call the LLM critic ─────────────────────────────────────────────
    let raw: string;
    try {
      const response = (await llm.invoke(criticMessages)) as AIMessage;
      raw = OrchestratorStateUtils.getContent(response);
    } catch (err) {
      this.logger.error(`[Reflection] LLM call failed: ${err}`);
      // Fail open — treat as PASS to avoid blocking the workflow
      const entry = this.buildEntry(state, 'PASS', 'Reflection LLM call failed; proceeding optimistically.', []);
      return { reflectionCount: reflectionCount + 1, reflectionLog: [entry] };
    }

    // ── 4. Parse verdict JSON ──────────────────────────────────────────────
    let verdict: ReflectionVerdict = 'PASS';
    let reasoning = '';
    let revisionsRequested: string[] = [];

    try {
      // Strip possible markdown fences the model may add despite instructions
      const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      verdict = parsed.verdict ?? 'PASS';
      reasoning = parsed.reasoning ?? '';
      revisionsRequested = Array.isArray(parsed.revisionsRequested) ? parsed.revisionsRequested : [];
    } catch {
      this.logger.warn(`[Reflection] Failed to parse JSON verdict. Raw: ${raw}`);
      // Treat unparseable response as PASS to avoid blocking
      verdict = 'PASS';
      reasoning = `Could not parse critic response. Raw output: ${raw.slice(0, 200)}`;
    }

    this.logger.log(
      `[Reflection] Worker="${lastWorkerNode}" verdict="${verdict}" reasoning="${reasoning}"`,
    );

    const entry = this.buildEntry(state, verdict, reasoning, revisionsRequested);

    this.eventBus.emitAgentAction(
      config.configurable || {},
      AgentActionType.REFLECTION_END,
      `Reflection ${verdict} — ${reasoning.slice(0, 120)}`,
    );

    // ── 5. When REVISE — inject a correction request into the message stream
    //       so the supervisor sees it and re-delegates with the critique context.
    const additionalMessages: BaseMessage[] = [];
    if (verdict === 'REVISE' && revisionsRequested.length > 0) {
      const correctionMessage = new HumanMessage(
        `[REFLECTION FEEDBACK — iteration ${reflectionCount + 1}]\n` +
          `The previous work by ${lastWorkerNode} requires corrections:\n\n` +
          revisionsRequested.map((r, i) => `${i + 1}. ${r}`).join('\n') +
          `\n\nPlease re-delegate to the appropriate worker and address each point above. ` +
          `Do NOT repeat already-correct work; focus only on the listed corrections.`,
      );
      additionalMessages.push(correctionMessage);
    }

    return {
      reflectionCount: reflectionCount + 1,
      reflectionLog: [entry],
      ...(additionalMessages.length > 0 ? { messages: additionalMessages } : {}),
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildEntry(
    state: typeof GraphState.State,
    verdict: ReflectionVerdict,
    reasoning: string,
    revisionsRequested: string[],
  ): ReflectionEntry {
    return {
      iteration: state.reflectionCount,
      worker: state.lastWorkerNode,
      verdict,
      reasoning,
      revisionsRequested,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extracts a readable log of recent tool calls and their results from the
   * full message history, scoped to be relevant (last 20 messages).
   */
  private buildWorkerLog(messages: BaseMessage[], workerNode: string): string {
    const relevant = messages.slice(-20);
    const lines: string[] = [];

    for (const msg of relevant) {
      const type = msg.getType();
      const content = OrchestratorStateUtils.getContent(msg);

      if (type === 'ai') {
        const ai = msg as AIMessage;
        if (ai.tool_calls?.length) {
          lines.push(`[AI → tool_calls] ${ai.tool_calls.map((tc) => `${tc.name}(${JSON.stringify(tc.args)})`).join(', ')}`);
        } else if (content) {
          lines.push(`[AI → text] ${content.slice(0, 400)}`);
        }
      } else if (type === 'tool') {
        lines.push(`[tool result] ${content.slice(0, 600)}`);
      } else if (type === 'human') {
        lines.push(`[human] ${content.slice(0, 400)}`);
      }
    }

    return lines.length > 0
      ? lines.join('\n')
      : `No execution log available for worker "${workerNode}".`;
  }

  /**
   * Summarises previous reflection entries for the same worker so the critic
   * knows which corrections were already attempted.
   */
  private buildRevisionHistory(log: ReflectionEntry[], workerNode: string): string {
    const relevant = log.filter((e) => e.worker === workerNode);
    if (relevant.length === 0) return '';

    return relevant
      .map(
        (e, idx) =>
          `Attempt ${idx + 1} [${e.timestamp}]: verdict=${e.verdict}\n` +
          `  Reasoning: ${e.reasoning}\n` +
          (e.revisionsRequested.length > 0
            ? `  Corrections requested:\n${e.revisionsRequested.map((r) => `    - ${r}`).join('\n')}`
            : '  (no specific corrections listed)'),
      )
      .join('\n\n');
  }
}
