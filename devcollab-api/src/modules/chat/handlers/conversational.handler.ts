import { Injectable, Logger } from '@nestjs/common';
import { GenerationPort } from 'src/modules/ai/ports/generation.port';
import { PromptPort } from 'src/modules/ai/ports/prompt.port';
import { IChatContext, IChatResponse } from '../types/ai-chat.interface';
import { ChatScope } from 'src/modules/ai/types/ai.types';

@Injectable()
export class ChatConversationalHandler {
  private readonly logger = new Logger(ChatConversationalHandler.name);

  constructor(
    private readonly generationPort: GenerationPort,
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

    const answer = await this.generationPort.generateText(messages, 'speedy');

    return {
      answer,
      context: '',
      validated: { isValid: true, warning: null },
    };
  }
}
