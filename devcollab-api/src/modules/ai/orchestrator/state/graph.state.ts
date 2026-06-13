import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export type ReflectionVerdict = 'PASS' | 'REVISE' | 'ABORT';

export interface ReflectionEntry {
  iteration: number;
  worker: string;
  verdict: ReflectionVerdict;
  reasoning: string;
  revisionsRequested: string[];
  timestamp: string;
}

/**
 * Defines the structured state for the LangGraph execution.
 * This is specific to how LangGraph manages message history and metadata.
 */
export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  iterationCount: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
  /**
   * Captures the original user mission statement at graph entry,
   * so the reflector can always compare against the ground truth.
   */
  missionContext: Annotation<string>({
    reducer: (_, y) => y,
    default: () => '',
  }),
  /**
   * Tracks how many reflection cycles have been triggered.
   * Used to prevent infinite revision loops.
   */
  reflectionCount: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
  /**
   * Accumulated log of all reflection verdicts across workers and iterations.
   */
  reflectionLog: Annotation<ReflectionEntry[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  /**
   * The name of the worker node that most recently completed execution.
   * The reflection node reads this to know which agent's output to critique.
   */
  lastWorkerNode: Annotation<string>({
    reducer: (_, y) => y,
    default: () => '',
  }),
});
