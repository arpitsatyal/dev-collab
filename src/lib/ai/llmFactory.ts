import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { getTogetherLLM } from "./togetherLLM";
import { getGroqLLM } from "./groqLLM";

// ─── Direct Model Access ────────────────────────────────────────────────────
// Reasoning = Together AI (70B)
// Speed = Groq (17B)

export async function getReasoningLLM(): Promise<BaseChatModel> {
    return getTogetherLLM().withFallbacks({
        fallbacks: [getGroqLLM()],
    }) as unknown as BaseChatModel;
}

export async function getSpeedyLLM(): Promise<BaseChatModel> {
    return getGroqLLM().withFallbacks({
        fallbacks: [getTogetherLLM()],
    }) as unknown as BaseChatModel;
}

// ─── Structured Output Wrappers ─────────────────────────────────────────────

export async function getReasoningStructuredLLM(schema: any, name: string) {
    const primary = getTogetherLLM();
    const fallback = getGroqLLM();

    const structuredPrimary = primary.withStructuredOutput(schema, { name });
    const structuredFallback = fallback.withStructuredOutput(schema, { name });

    return structuredPrimary.withFallbacks({
        fallbacks: [structuredFallback],
    });
}

// ─── Tool-Bound Wrappers ───────────────────────────────────────────────────

export async function getReasoningToolBoundLLM(tools: any[]) {
    const primary = getTogetherLLM();
    const fallback = getGroqLLM();

    const boundPrimary = primary.bindTools(tools);
    const boundFallback = fallback.bindTools(tools);

    return boundPrimary.withFallbacks({
        fallbacks: [boundFallback],
    });
}

