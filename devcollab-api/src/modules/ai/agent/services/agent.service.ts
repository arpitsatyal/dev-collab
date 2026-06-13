import { Injectable, Logger } from '@nestjs/common';
import { AgentOrchestrator, AgentPort } from '../ports/agent.port';
import { IAiResult, LlmMessage } from 'src/modules/ai/types/ai.types';
import { AgentRunOptions } from '../types/agent.types';

@Injectable()
export class AgentService implements AgentPort {
  private readonly logger = new Logger(AgentService.name);

  constructor(private readonly orchestrator: AgentOrchestrator) { }

  async execute(
    messages: LlmMessage[],
    workspaceId: string,
    options: AgentRunOptions,
  ): Promise<IAiResult> {
    this.logger.log(`Agent executing task in workspace: ${workspaceId}`);

    // The AgentService can perform high-level pre-processing here if needed
    // (e.g., checking permissions, auditing, or modifying the input messages)

    const result = await this.orchestrator.run(messages, workspaceId, options);

    // High-level post-processing
    this.logger.log(`Agent task completed with ${result.calledTools?.length ?? 0} tool calls.`);

    return result;
  }
}
