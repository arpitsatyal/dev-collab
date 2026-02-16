import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { TogetherLLM } from "./togetherLLM";

export type LLMProvider = "TOGETHER" | "OPENAI" | "ANTHROPIC";

export function getLLM(provider?: LLMProvider): BaseChatModel {
    const selectedProvider = provider || (process.env.LLM_PROVIDER as LLMProvider) || "TOGETHER";

    switch (selectedProvider) {
        case "TOGETHER":
            return new TogetherLLM({});
        default:
            console.warn(`Unknown LLM provider: ${selectedProvider}. Defaulting to TOGETHER.`);
            return new TogetherLLM({});
    }
}
