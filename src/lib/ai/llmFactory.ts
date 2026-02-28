import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { getTogetherLLM } from "./togetherLLM";
import { getGroqLLM } from "./groqLLM";

export type LLMProvider = "TOGETHER" | "GROQ" | "OPENAI" | "ANTHROPIC";

export function getLLM(provider?: LLMProvider) {
    const selectedProvider = provider || (process.env.LLM_PROVIDER as LLMProvider) || "TOGETHER";

    switch (selectedProvider) {
        case "TOGETHER":
            return getTogetherLLM();
        case "GROQ":
            return getGroqLLM();
        default:
            console.warn(`Unknown LLM provider: ${selectedProvider}. Defaulting to TOGETHER.`);
            return getTogetherLLM();
    }
}

/**
 * Get LLM with automatic fallback using LangChain's native withFallbacks
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

    const primaryLLM = getLLM(primary);
    const fallbackLLM = getLLM(fallback);

    return primaryLLM.withFallbacks({
        fallbacks: [fallbackLLM],
    }) as unknown as BaseChatModel;
}

/**
 * Specifically for Structured Output. 
 * LangChain's .withFallbacks() returns a Runnable, which strips the .withStructuredOutput method.
 * Instead, we must apply .withStructuredOutput() to EACH model FIRST, and then combine them with fallbacks.
 */
export async function getStructuredLLMWithFallback(schema: any, name: string) {
    const primary = (process.env.LLM_PROVIDER as LLMProvider) || "TOGETHER";
    const fallback = (process.env.LLM_FALLBACK_PROVIDER as LLMProvider) || "GROQ";

    const primaryLLM = getLLM(primary);
    const fallbackLLM = getLLM(fallback);

    // Check if the underlying models actually support structured output (ChatOpenAI does)
    if (typeof primaryLLM.withStructuredOutput !== 'function' || typeof fallbackLLM.withStructuredOutput !== 'function') {
        throw new Error("One or more configured LLMs do not support withStructuredOutput.");
    }

    // Apply structured output constraint BEFORE wrapping in fallback
    const structuredPrimary = primaryLLM.withStructuredOutput(schema, { name });
    const structuredFallback = fallbackLLM.withStructuredOutput(schema, { name });

    return structuredPrimary.withFallbacks({
        fallbacks: [structuredFallback],
    });
}
