import axios from "axios";
import { SimpleChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage } from "@langchain/core/messages";
import { getSecret } from "../../utils/secrets";

export class GroqLLM extends SimpleChatModel {
    _llmType(): string {
        return "groq";
    }

    async _call(messages: BaseMessage[]): Promise<string> {
        try {
            const messagesPayload = messages.map((msg) => {
                const role = msg.getType() === "human" ? "user" : (msg.getType() === "ai" ? "assistant" : "system");
                return { role, content: msg.content as string };
            });

            const response = await axios.post(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    model: "llama-3.1-8b-instant",
                    messages: messagesPayload,
                    max_tokens: 4096,
                    temperature: 0.7,
                },
                {
                    headers: {
                        Authorization: `Bearer ${getSecret("GROQ_API_KEY") || process.env.GROQ_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const output = response.data.choices?.[0]?.message?.content?.trim();

            if (!output) {
                throw new Error("No valid response text received from Groq API.");
            }

            return output;
        } catch (error: any) {
            console.error(
                "GroqLLM error:",
                error?.response?.data || error?.message || error
            );
            throw error;
        }
    }

    _identifyingParams(): Record<string, unknown> {
        return { model: "llama-3.1-8b-instant", provider: "groq" };
    }
}
