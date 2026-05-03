import { LlmProviderPort } from '../ports/llm-provider.port';
import type { LlmProvider } from '../enums/llm-provider.enum';

export interface ProviderContext {
  primary: LlmProviderPort;
  secondary: LlmProviderPort;
  primaryType: LlmProvider;
  secondaryType: LlmProvider;
  primaryFailed: boolean;
  secondaryFailed: boolean;
  markPrimaryFailed: () => void;
  markSecondaryFailed: () => void;
}
