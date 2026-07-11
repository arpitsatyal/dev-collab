import { Injectable, Logger } from '@nestjs/common';
import { GenerationPort } from 'src/modules/ai/ports/generation.port';
import { PromptPort } from 'src/modules/ai/ports/prompt.port';
import { IintentResult } from 'src/modules/ai/types/ai.types';
import { IntentSchema } from 'src/modules/ai/schemas';
import { IChatContext } from '../../types/ai-chat.interface';

@Injectable()
export class ChatIntentService {
  private readonly logger = new Logger(ChatIntentService.name);

  constructor(
    private readonly generationPort: GenerationPort,
    private readonly promptPort: PromptPort,
  ) { }

  /**
   * Classifies the user's intent using a structured LLM call.
   */
  async classifyIntent(context: IChatContext): Promise<IintentResult> {
    const intentMessages = this.promptPort.buildIntentClassificationPrompt(
      context.question,
      context.history,
      context.inWorkspace,
    );

    try {
      const result = await this.generationPort.generateStructured<any>(
        intentMessages,
        IntentSchema,
        'classify_intent',
      );
      if (result.confidence > 0.4) {
        return {
          intent: result.intent,
          scope: result.scope,
          confidence: result.confidence,
        };
      }
      this.logger.warn(
        'Intent Classification: Low confidence, defaulting to WORKSPACE_QUERY',
      );
    } catch (e) {
      this.logger.warn(
        `Intent Classification failed: ${e instanceof Error ? e.message : e}`,
      );
    }

    return {
      intent: context.inWorkspace ? 'WORKSPACE_QUERY' : 'CONVERSATIONAL',
      scope: context.inWorkspace ? 'APP_SPECIFIC' : 'OUT_OF_SCOPE',
      confidence: 0,
    };
  }
}
