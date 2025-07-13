import axios from "axios";
import { SimpleChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage } from "@langchain/core/messages";
import { getSecret } from "../utils/secrets";

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
      const prompt = messages
        .map((msg) =>
          msg.getType() === "human"
            ? `User: ${msg.text}`
            : msg.getType() === "ai"
              ? `Assistant: ${msg.text}`
              : msg.text
        )
        .join("\n");

      console.log("api key", getSecret("TOGETHER_API_KEY"));
      const response = await axios.post<TogetherAIResponse>(
        "https://api.together.xyz/inference",
        {
          model: "mistralai/Mistral-7B-Instruct-v0.2",
          prompt,
          max_tokens: 512,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${getSecret("TOGETHER_API_KEY")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const output =
        response.data.output?.choices?.[0]?.text?.trim() ||
        response.data.choices?.[0]?.text?.trim();

      if (!output) {
        throw new Error("No valid response text received from Together API.");
      }

      return output;
    } catch (error: any) {
      console.error(
        "TogetherLLM error:",
        error?.response?.data || error?.message || error
      );
      throw new Error("Failed to generate a response from TogetherLLM.");
    }
  }

  _identifyingParams(): Record<string, unknown> {
    return { model: "mistralai/Mistral-7B-Instruct-v0.2" };
  }
}
