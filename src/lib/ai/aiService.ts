import { TogetherLLM } from "./togetherLLM";
import { getVectorStore } from "./vectorStore";
import prisma from "../db/prisma";
import { validateResponse } from "../../pages/api/utils/validateLLMResponse";

// Helper to provide source citations for factual answers
function improveResponseWithCitations(answer: string, filteredResults: any[]): string {
    // Add source citations at the end ONLY if we used context
    if (filteredResults.length > 0 && !answer.includes("Source:")) {
        const sources = [...new Set(
            filteredResults.map(([doc]) => doc.metadata?.type || 'Documentation')
        )];

        // We only append sources if the LLM didn't give a "no info" response
        const containsInfo = !answer.toLowerCase().includes("i don't have information");
        if (containsInfo) {
            answer += `\n\n_Sources: ${sources.join(", ")}_`;
        }
    }

    return answer;
}

export async function getAIResponse(chatId: string, question: string) {
    const vectorStore = await getVectorStore();
    const scoreThreshold = 0.5;
    const resultsWithScores = await vectorStore.similaritySearchWithScore(question, 7);

    // Filter and format context
    const filteredResults = resultsWithScores.filter(([doc, score]) => score >= scoreThreshold);

    console.log(`Search results: ${resultsWithScores.length}, Filtered: ${filteredResults.length}`);
    resultsWithScores.forEach(([doc, score], i) => {
        console.log(`Result ${i + 1}: Score: ${score.toFixed(4)}, Type: ${doc.metadata?.type}, Title: ${doc.metadata?.projectTitle}`);
    });

    const context = filteredResults.length > 0
        ? filteredResults.map(([doc, score]) => {
            const type = doc.metadata?.type || 'General Info';
            const title = doc.metadata?.projectTitle || 'Unknown Project';
            return `--- Source: Information from ${type} within project "${title}" ---\n${doc.pageContent}`;
        }).join("\n\n")
        : "I don't have enough specific information in my records to answer this fully.";

    const llm = new TogetherLLM({});

    const pastMessages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 10,
    });

    const history = pastMessages
        .map((m) => (m.isUser ? `User: ${m.content}` : `AI: ${m.content}`))
        .join("\n");

    const fullPrompt = `You are a helpful and friendly AI Assistant for the Dev-Collab platform.

Your goal is to assist users with their questions about projects, documentation, and tasks while maintaining a warm, professional persona.

GROUNDING GUIDELINES:
1. INFORMATIONAL QUESTIONS: If the user is asking about specific project data, features, or documentation, use the "DATA CONTENT" below as your primary source.
2. NO DATA FOUND: If the "DATA CONTENT" doesn't contain the specific answer for a factual question, politely state that it's not in your current records and offer general helpful advice.
3. CONVERSATIONAL INTERACTION: If the user provides feedback, greetings, or short acknowledgments (e.g., "Hi", "Thanks", "Cooool"), respond naturally as a friendly assistant. You do NOT need to reference the "DATA CONTEXT" for these interactions.

TONE & STYLE:
- Speak naturally. Never use technical terms like "relevance", "data context", "provided records", or "context score" in your response to the user.
- Instead of saying "based on the context provided", just state the information directly (e.g., "There are currently three projects...").
- Keep your answers clean, focused, and free of meta-talk about how you found the information.

DATA CONTENT:
${context}

CONVERSATION HISTORY:
${history}

USER QUESTION:
${question}

YOUR RESPONSE:`;

    const aiResponse = await llm.invoke(fullPrompt);

    let answer = aiResponse["lc_kwargs"].content;
    answer = improveResponseWithCitations(answer, filteredResults);

    const validated = await validateResponse(answer, context);

    if (validated.warning) {
        console.log('warning', validated.warning);
    }

    return { answer, context, validated };
}
