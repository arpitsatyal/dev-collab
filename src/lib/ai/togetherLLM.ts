import axios from "axios";
import { SimpleChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage } from "@langchain/core/messages";
import { getSecret } from "../../utils/secrets";

interface TogetherAIResponse {
  output?: {
    choices?: Array<{
      text: string;
    }>;
  };
  choices?: Array<{
    text: string;
  }>;
}

export class TogetherLLM extends SimpleChatModel {
  _llmType(): string {
    return "together-ai";
  }

  async _call(messages: BaseMessage[]): Promise<string> {
    try {
      const messagesPayload = messages.map((msg) => {
        const role = msg.getType() === "human" ? "user" : (msg.getType() === "ai" ? "assistant" : "system");
        return { role, content: msg.content as string };
      });

      const response = await axios.post(
        "https://api.together.xyz/v1/chat/completions",
        {
          model: "mistralai/Mistral-7B-Instruct-v0.2",
          messages: messagesPayload,
          max_tokens: 3072,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${getSecret("TOGETHER_API_KEY") || process.env.TOGETHER_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const output = response.data.choices?.[0]?.message?.content?.trim();

      if (!output) {
        throw new Error("No valid response text received from Together API.");
      }

      return output;
    } catch (error: any) {
      console.error(
        "TogetherLLM error:",
        error?.response?.data || error?.message || error
      );
      throw error;
    }
  }

  _identifyingParams(): Record<string, unknown> {
    return { model: "mistralai/Mistral-7B-Instruct-v0.2" };
  }
}
