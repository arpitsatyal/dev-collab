
import { getLLMWithFallback } from "../llmFactory";
import prisma from "../../db/prisma";
// Import new services
import { performHybridSearch } from "./retrievalService";
import { generateQueryVariations, constructPrompt } from "./promptService";
import { generateAnswer } from "./generationService";

// Helper for database keyword search (REMOVED - moved to retrievalService)
// Helper to provide source citations (REMOVED - moved to generationService)
// Helper for Query Expansion (REMOVED - moved to promptService)

export async function getAIResponse(chatId: string, question: string, filters?: Record<string, any>) {
    const llm = await getLLMWithFallback();

    // 0. Query Expansion
    const queries = await generateQueryVariations(question, llm);

    // 1 & 2. Retrieval (Hybrid Vector + Keyword)
    const filteredResults = await performHybridSearch(queries, question, filters);

    filteredResults.forEach(([doc, score]: any, i) => {
        console.log(`Result ${i + 1}: Score: ${score.toFixed(4)}, Type: ${doc.metadata?.type}, Title: ${doc.metadata?.projectTitle}`);
    });

    const context = filteredResults.length > 0
        ? filteredResults.map(([doc, score]: any) => {
            const type = doc.metadata?.type || 'General Info';
            const title = doc.metadata?.projectTitle || 'Unknown Project';
            return `--- Source: Information from ${type} within project "${title}" ---\n${doc.pageContent}`;
        }).join("\n\n")
        : "I don't have enough specific information in my records to answer this fully.";

    // 3. History
    const pastMessages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 10,
    });

    const history = pastMessages
        .map((m) => (m.isUser ? `User: ${m.content}` : `AI: ${m.content}`))
        .join("\n");

    // 4. Prompt Construction
    const fullPrompt = constructPrompt(context, history, question);

    // 5. Generation
    return await generateAnswer(llm, fullPrompt, context, filteredResults);
}
