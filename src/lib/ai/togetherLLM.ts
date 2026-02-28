import { ChatOpenAI } from "@langchain/openai";
import { getSecret } from "../../utils/secrets";

export const getTogetherLLM = () => {
  return new ChatOpenAI({
    modelName: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    apiKey: getSecret("TOGETHER_API_KEY"),
    configuration: {
      baseURL: "https://api.together.xyz/v1",
    },
    maxTokens: 3072,
    temperature: 0.7,
  });
};
