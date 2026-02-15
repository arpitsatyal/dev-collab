import { TogetherLLM } from "../togetherLLM";
import { getVectorStore } from "../vectorStore";
import prisma from "../prisma";
import { validateResponse } from "../../pages/api/utils/validateLLMResponse";

// Helper to improve response with citations and quality checks
function improveResponseWithCitations(answer: string, filteredResults: any[]): string {
    // Check if LLM said "I don't have information"
    const noInfoPhrases = [
        "i don't have specific information",
        "i don't have information",
        "no information found",
        "i cannot find",
        "not available in my knowledge base"
    ];

    const saidNoInfo = noInfoPhrases.some(phrase =>
        answer.toLowerCase().includes(phrase)
    );

    // If LLM said no info BUT we actually have good context, something's wrong
    if (saidNoInfo && filteredResults.length > 0) {
        const topResult = filteredResults[0];
        const score = topResult[1];

        if (score > 0.7) {
            console.log("⚠️  LLM refused to answer despite good context (score: " + score.toFixed(3) + ")");
        }
    }

    // Check if answer is too short (might be lazy)
    if (answer.length < 50 && filteredResults.length > 0) {
        console.log("⚠️  Very short answer despite having context");
    }

    // Add source citations at the end if not already present
    if (filteredResults.length > 0 && !answer.includes("Source:")) {
        const sources = [...new Set(
            filteredResults.map(([doc]) => doc.metadata?.type || 'Documentation')
        )];

        answer += `\n\n_Sources: ${sources.join(", ")}_`;
    }

    return answer;
}

export async function getAIResponse(chatId: string, question: string) {
    const vectorStore = await getVectorStore();
    const scoreThreshold = 0.5;
    const resultsWithScores = await vectorStore.similaritySearchWithScore(question, 5);

    // Filter and format context
    const filteredResults = resultsWithScores.filter(([doc, score]) => score >= scoreThreshold);

    console.log(`Search results: ${resultsWithScores.length}, Filtered: ${filteredResults.length}`);
    resultsWithScores.forEach(([doc, score], i) => {
        console.log(`Result ${i + 1}: Score: ${score.toFixed(4)}, Type: ${doc.metadata?.type}, Title: ${doc.metadata?.projectTitle}`);
    });

    const context = filteredResults.length > 0
        ? filteredResults.map(([doc, score]) => {
            const type = doc.metadata?.type || 'General';
            const title = doc.metadata?.projectTitle || 'N/A';
            return `[Source: ${type} in Project: ${title}] (Relevance: ${score.toFixed(2)})\n${doc.pageContent}`;
        }).join("\n---\n")
        : "No direct information found in documentation for this specific query.";

    const llm = new TogetherLLM({});

    const pastMessages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 10,
    });

    const history = pastMessages
        .map((m) => (m.isUser ? `User: ${m.content}` : `AI: ${m.content}`))
        .join("\n");

    const fullPrompt = `You are the Dev-Collab AI Assistant. Your role is to help users understand and use the Dev-Collab platform effectively.

CRITICAL RULES:
1. Answer ONLY using information from the Context below
2. If the Context doesn't contain the answer, say: "I don't have specific information about that in my knowledge base. Let me suggest: [relevant alternative or point them to support]"
3. Be specific - reference exact UI locations, button names, and steps
4. If the Context is partially relevant, use what you can and acknowledge what's missing
5. Never make up features, prices, or capabilities not in the Context
6. Keep answers focused and actionable

CONTEXT FROM DOCUMENTATION:
${context}

CONVERSATION HISTORY:
${history}

USER QUESTION:
${question}

YOUR RESPONSE (remember: only use information from Context above):`;

    const aiResponse = await llm.invoke(fullPrompt);

    let answer = aiResponse["lc_kwargs"].content;
    answer = improveResponseWithCitations(answer, filteredResults);

    const validated = await validateResponse(answer, context);

    if (validated.warning) {
        console.log('warning', validated.warning);
    }

    return { answer, context, validated };
}
