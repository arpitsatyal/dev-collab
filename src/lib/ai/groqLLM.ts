import { ChatOpenAI } from "@langchain/openai";
import { getSecret } from "../../utils/secrets";

export const getGroqLLM = () => {
    return new ChatOpenAI({
        modelName: "meta-llama/llama-4-scout-17b-16e-instruct",
        apiKey: getSecret("GROQ_API_KEY"),
        configuration: {
            baseURL: "https://api.groq.com/openai/v1",
        },
        maxTokens: 4096,
        temperature: 0.7,
    });
};
