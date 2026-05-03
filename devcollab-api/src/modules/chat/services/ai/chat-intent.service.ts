import { Injectable, Logger } from '@nestjs/common';
import { LlmGateway } from 'src/modules/ai/llms/ports/llm.port';
import { PromptPort } from 'src/modules/ai/ports/prompt.port';
import { IintentResult, IntentClassifierLlm } from 'src/modules/ai/interfaces/ai.types';
import { IntentSchema } from 'src/modules/ai/schemas';
import { IChatContext } from '../../interfaces/ai-chat.interface';

@Injectable()
export class ChatIntentService {
  private readonly logger = new Logger(ChatIntentService.name);

  constructor(
    private readonly llmGateway: LlmGateway,
    private readonly promptPort: PromptPort,
  ) { }

  /**
   * Classifies the user's intent using a structured LLM call.
   */
  async classifyIntent(context: IChatContext): Promise<IintentResult> {
    const classifierLlm = (await this.llmGateway.getReasoningStructuredLLM(
      IntentSchema,
      'classify_intent',
    )) as IntentClassifierLlm;

    const intentMessages = this.promptPort.buildIntentClassificationPrompt(
      context.question,
      context.history,
      context.inWorkspace,
    );

    try {
      const result = await classifierLlm.invoke(intentMessages);
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
      intent: 'WORKSPACE_QUERY',
      scope: context.inWorkspace ? 'APP_SPECIFIC' : 'OUT_OF_SCOPE',
      confidence: 0,
    };
  }
}
