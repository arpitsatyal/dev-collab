import { Injectable, Logger } from '@nestjs/common';
import { LlmGateway } from 'src/modules/ai/orchestrator/llm/llm.types';
import { PromptPort } from 'src/modules/ai/ports/prompt.port';
import { IChatContext, IChatResponse } from '../types/ai-chat.interface';
import { ChatScope } from 'src/modules/ai/types/ai.types';

@Injectable()
export class ChatConversationalHandler {
  private readonly logger = new Logger(ChatConversationalHandler.name);

  constructor(
    private readonly llmGateway: LlmGateway,
    private readonly promptPort: PromptPort,
  ) { }

  /**
   * Handles plain conversational requests that don't require workspace tools or search.
   */
  async handle(context: IChatContext, scope: string): Promise<IChatResponse> {
    this.logger.log(`Handling CONVERSATIONAL intent (Scope: ${scope})`);

    const messages = this.promptPort.buildConversationalMessages(
      context.history,
      context.question,
      scope as ChatScope,
    );

    const conversationalLlm = await this.llmGateway.getSpeedyLLM();
    const answer = await conversationalLlm.generateText(messages);

    return {
      answer,
      context: '',
      validated: { isValid: true, warning: null },
    };
  }
}
