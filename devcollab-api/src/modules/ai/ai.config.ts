import { Injectable } from '@nestjs/common';

@Injectable()
export class AiConfig {
  /** LangGraph recursion limit - caps total node visits across the entire graph. */
  readonly maxIterations = 50;

  /**
   * Maximum number of reflection cycles per worker invocation.
   * After this many REVISE verdicts the reflector emits ABORT and the
   * supervisor is allowed to conclude the mission.
   * Must stay in sync with MAX_REFLECTION_RETRIES in graph-reflection.service.ts.
   */
  readonly maxReflectionRetries = 3;
}
