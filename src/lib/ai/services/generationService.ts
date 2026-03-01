
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { validateResponse } from "../../../pages/api/utils/validateLLMResponse";

// Helper to provide source citations for factual answers
export function improveResponseWithCitations(answer: string, filteredResults: any[]) {
    // Add source citations at the end ONLY if we used context
    if (filteredResults.length > 0 && !answer.includes("Source:")) {
        const sources = [...new Set(
            filteredResults.map(([doc]: any) => doc.metadata?.type || 'Documentation')
        )];

        // We only append sources if the LLM didn't give a "no info" response
        const containsInfo = !answer.toLowerCase().includes("i don't have information");
        if (containsInfo) {
            answer += `\n\n_Sources: ${sources.join(", ")}_`;
        }
    }

    return answer;
}

export async function generateAnswer(llm: BaseChatModel, prompt: string, context: string, filteredResults: any[]) {
    let answer = await llm.pipe(new StringOutputParser()).invoke(prompt);

    answer = improveResponseWithCitations(answer, filteredResults);

    const validated = await validateResponse(answer, context);

    if (validated.warning) {
        console.log('warning', validated.warning);
    }

    return { answer, context, validated };
}
