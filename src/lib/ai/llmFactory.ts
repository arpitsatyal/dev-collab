import { BaseChatModel, SimpleChatModel } from "@langchain/core/language_models/chat_models";
import { TogetherLLM } from "./togetherLLM";
import { GroqLLM } from "./groqLLM";
import { BaseMessage } from "@langchain/core/messages";

export type LLMProvider = "TOGETHER" | "GROQ" | "OPENAI" | "ANTHROPIC";

export function getLLM(provider?: LLMProvider): BaseChatModel {
    const selectedProvider = provider || (process.env.LLM_PROVIDER as LLMProvider) || "TOGETHER";

    switch (selectedProvider) {
        case "TOGETHER":
            return new TogetherLLM({});
        case "GROQ":
            return new GroqLLM({});
        default:
            console.warn(`Unknown LLM provider: ${selectedProvider}. Defaulting to TOGETHER.`);
            return new TogetherLLM({});
    }
}

/**
 * Get LLM with automatic fallback
 * 
 * Primary provider: LLM_PROVIDER env (default: TOGETHER)
 * Fallback provider: LLM_FALLBACK_PROVIDER env (default: GROQ)
 * 
 * Example .env:
 * LLM_PROVIDER=TOGETHER
 * LLM_FALLBACK_PROVIDER=GROQ
 */
export async function getLLMWithFallback(): Promise<BaseChatModel> {
    const primary = (process.env.LLM_PROVIDER as LLMProvider) || "TOGETHER";
    const fallback = (process.env.LLM_FALLBACK_PROVIDER as LLMProvider) || "GROQ";

    return new FallbackLLM(primary, fallback);
}

/**
 * LLM wrapper with configurable fallback chain
 */
class FallbackLLM extends SimpleChatModel {
    private primaryLLM: BaseChatModel;
    private fallbackLLM: BaseChatModel;
    private primaryName: string;
    private fallbackName: string;

    constructor(primaryProvider: LLMProvider, fallbackProvider: LLMProvider) {
        super({});
        this.primaryLLM = getLLM(primaryProvider);
        this.fallbackLLM = getLLM(fallbackProvider);
        this.primaryName = primaryProvider;
        this.fallbackName = fallbackProvider;
    }

    _llmType(): string {
        return "fallback-llm";
    }

    async _call(messages: BaseMessage[]): Promise<string> {
        try {
            const response = await this.primaryLLM.invoke(messages);
            return response.content as string;
        } catch (error: any) {
            const status = error?.response?.status;
            const isRateLimit = status === 429 || status === 503;

            if (isRateLimit) {
                console.warn(`[LLM] ${this.primaryName} failed (rate limit/unavailable), falling back to ${this.fallbackName}...`);
                const fallbackResponse = await this.fallbackLLM.invoke(messages);
                return fallbackResponse.content as string;
            }

            // Re-throw if it's not a rate limit error
            throw error;
        }
    }

    _identifyingParams(): Record<string, unknown> {
        return {
            primary: this.primaryName,
            fallback: this.fallbackName
        };
    }
}
