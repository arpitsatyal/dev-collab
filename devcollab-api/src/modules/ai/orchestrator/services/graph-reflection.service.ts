import { Injectable, Logger } from '@nestjs/common';
import { AIMessage, BaseMessage } from '@langchain/core/messages';
import { AgentRunnableConfig } from '../types/orchestrator.types';
import {
  GraphState,
  ReflectionEntry,
  ReflectionVerdict,
} from '../state/graph.state';
import { ToolEnabledLlm } from 'src/modules/ai/llm/llm.types';
import { EventBusService } from 'src/common/events/event-bus.service';
import { AgentActionType } from 'src/common/events/agent-events.enums';
import { OrchestratorStateUtils } from '../utils/orchestrator-state.utils';
import { OrchestratorPromptPort } from '../ports/prompt.port';

/** Maximum reflection cycles before the graph is forced to move on. */
export const MAX_REFLECTION_RETRIES = 3;

@Injectable()
export class GraphReflectionService {
  private readonly logger = new Logger(GraphReflectionService.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly promptService: OrchestratorPromptPort,
  ) {}

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
    llm: ToolEnabledLlm,
    config: AgentRunnableConfig,
  ): Promise<Partial<typeof GraphState.State>> {
    const {
      missionContext,
      reflectionCount,
      reflectionLog,
      lastWorkerNode,
      messages,
    } = state;

    this.eventBus.emitAgentAction(
      config.configurable || {},
      AgentActionType.REFLECTION_START,
      `Reflecting on ${lastWorkerNode} output (attempt ${reflectionCount + 1}/${MAX_REFLECTION_RETRIES})`,
    );

    const abortState = this.getAbortStateIfMaxRetries(state, config);
    if (abortState) {
      return abortState;
    }

    const workerLog = this.buildWorkerLog(messages, lastWorkerNode);
    const revisionHistory = this.buildRevisionHistory(
      reflectionLog,
      lastWorkerNode,
    );

    const criticMessages = this.promptService.buildCriticMessages(
      missionContext,
      lastWorkerNode,
      workerLog,
      revisionHistory,
    );

    const raw = await this.invokeCritic(criticMessages, llm);
    if (raw === null) {
      const entry = this.buildEntry(
        state,
        'PASS',
        'Reflection LLM call failed; proceeding optimistically.',
        [],
      );
      return { reflectionCount: reflectionCount + 1, reflectionLog: [entry] };
    }

    const { verdict, reasoning, revisionsRequested } =
      this.parseReflectionVerdict(raw);

    this.logger.log(
      `[Reflection] Worker="${lastWorkerNode}" verdict="${verdict}" reasoning="${reasoning}"`,
    );

    const entry = this.buildEntry(
      state,
      verdict,
      reasoning,
      revisionsRequested,
    );

    this.eventBus.emitAgentAction(
      config.configurable || {},
      AgentActionType.REFLECTION_END,
      `Reflection ${verdict} — ${reasoning.slice(0, 120)}`,
    );

    const additionalMessages = this.promptService.buildCorrectionMessages(
      reflectionCount + 1,
      lastWorkerNode,
      revisionsRequested,
    );

    return {
      reflectionCount: reflectionCount + 1,
      reflectionLog: [entry],
      ...(additionalMessages.length > 0
        ? { messages: additionalMessages }
        : {}),
    };
  }

  private getAbortStateIfMaxRetries(
    state: typeof GraphState.State,
    config: AgentRunnableConfig,
  ): Partial<typeof GraphState.State> | null {
    const { reflectionCount, lastWorkerNode } = state;
    if (reflectionCount < MAX_REFLECTION_RETRIES) {
      return null;
    }

    this.logger.warn(
      `[Reflection] Max retries (${MAX_REFLECTION_RETRIES}) reached for worker "${lastWorkerNode}". Forcing ABORT.`,
    );

    const abortEntry = this.buildEntry(
      state,
      'ABORT',
      'Maximum reflection retries reached. Proceeding with best-effort result.',
      [],
    );

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

  private async invokeCritic(
    criticMessages: BaseMessage[],
    llm: ToolEnabledLlm,
  ): Promise<string | null> {
    try {
      const response = (await llm.invoke(criticMessages)) as AIMessage;
      return OrchestratorStateUtils.getContent(response);
    } catch (err) {
      this.logger.error(`[Reflection] LLM call failed: ${err}`);
      return null;
    }
  }

  private parseReflectionVerdict(raw: string): {
    verdict: ReflectionVerdict;
    reasoning: string;
    revisionsRequested: string[];
  } {
    try {
      const cleaned = raw
        .replace(/```(?:json)?/gi, '')
        .replace(/```/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      return {
        verdict: parsed.verdict ?? 'PASS',
        reasoning: parsed.reasoning ?? '',
        revisionsRequested: Array.isArray(parsed.revisionsRequested)
          ? parsed.revisionsRequested
          : [],
      };
    } catch {
      this.logger.warn(
        `[Reflection] Failed to parse JSON verdict. Raw: ${raw}`,
      );
      return {
        verdict: 'PASS',
        reasoning: `Could not parse critic response. Raw output: ${raw.slice(0, 200)}`,
        revisionsRequested: [],
      };
    }
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
      const type = msg.type;
      const content = OrchestratorStateUtils.getContent(msg);

      switch (type) {
        case 'ai': {
          if (AIMessage.isInstance(msg)) {
            if (msg.tool_calls?.length) {
              lines.push(
                `[AI → tool_calls] ${msg.tool_calls.map((tc) => `${tc.name}(${JSON.stringify(tc.args)})`).join(', ')}`,
              );
            } else if (content) {
              lines.push(`[AI → text] ${content.slice(0, 400)}`);
            }
          }
          break;
        }
        case 'tool':
          lines.push(`[tool result] ${content.slice(0, 600)}`);
          break;
        case 'human':
          lines.push(`[human] ${content.slice(0, 400)}`);
          break;
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
  private buildRevisionHistory(
    log: ReflectionEntry[],
    workerNode: string,
  ): string {
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
