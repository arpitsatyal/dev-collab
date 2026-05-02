import type { GroqLlmService } from '../groq-llm.service';
import type { TogetherLlmService } from '../together-llm.service';
import type { LlmProvider } from '../enums/llm-provider.enum';

export interface ProviderContext {
  primary: GroqLlmService | TogetherLlmService;
  secondary: GroqLlmService | TogetherLlmService;
  primaryType: LlmProvider;
  secondaryType: LlmProvider;
  primaryFailed: boolean;
  secondaryFailed: boolean;
  markPrimaryFailed: () => void;
  markSecondaryFailed: () => void;
}
