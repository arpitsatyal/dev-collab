

import { describe, test, expect, beforeAll } from 'vitest';
import { getLLM } from "../src/lib/ai/llmFactory";
import { getVectorStore } from "../src/lib/ai/vectorStore";

// Test cases - real questions based on project data
const testCases = [
    {
        question: "What are the core objectives of the project?",
        expectedKeywords: ["SMART", "goals", "objectives"],
        category: "planning"
    },
    {
        question: "Who is identifying stakeholders and what are their roles?",
        expectedKeywords: ["Sponsor", "Manager", "funding"],
        category: "stakeholders"
    },
    {
        question: "Tell me about the initial project planning documentation.",
        expectedKeywords: ["Phase", "Documentation", "Planning"],
        category: "documentation"
    },
    {
        question: "What is considered 'In Scope' for this project?",
        expectedKeywords: ["deliverables", "functionalities", "scope"],
        category: "scope"
    },
    {
        question: "What are the main project milestones?",
        expectedKeywords: ["Kick-off", "Freeze", "Milestone"],
        category: "timeline"
    },
    {
        question: "Cooool",
        expectedKeywords: [],
        category: "conversation"
    },
    {
        question: "How many projects are currently on the platform?",
        expectedKeywords: ["project", "platform"],
        category: "stats"
    },
    {
        question: "What is the Collaborative Playground and what can I do there?",
        expectedKeywords: ["collaborative", "code editor", "sharing", "real-time"],
        category: "features"
    }
];

describe('RAG Quality Assurance', () => {
    let vectorStore: any;
    let llm: any;
    const scoreThreshold = 0.5;

    beforeAll(async () => {
        vectorStore = await getVectorStore();
        llm = getLLM();
    });

    test.each(testCases)('should handle "$category": $question', async ({ question, expectedKeywords }: { question: string, expectedKeywords: string[] }) => {
        // 1. Test retrieval quality
        const resultsWithScores = await vectorStore.similaritySearchWithScore(question, 5);
        const filteredResults = resultsWithScores.filter(([doc, score]: [any, number]) => score >= scoreThreshold);

        // Log results for debugging
        if (resultsWithScores.length > 0) {
            console.log(`Top match for "${question}": ${resultsWithScores[0][1].toFixed(3)} - ${resultsWithScores[0][0].pageContent.substring(0, 50)}...`);
        }

        // 2. Prepare context
        const context = filteredResults.length > 0
            ? filteredResults.map(([doc, score]: [any, number]) => {
                const type = doc.metadata?.type || 'General';
                const title = doc.metadata?.projectTitle || 'N/A';
                return `[Source: ${type} in Project: ${title}] (Relevance: ${score.toFixed(2)})\n${doc.pageContent}`;
            }).join("\n---\n")
            : "No direct information found in documentation for this specific query.";

        // 3. Test LLM response
        const fullPrompt = `You are a helpful and friendly AI Assistant for the Dev-Collab platform.
        ... (context omitted for brevity) ...
        DATA CONTEXT:
        ${context}
        
        USER QUESTION:
        ${question}
        
        YOUR RESPONSE:`;

        const aiResponse = await llm.invoke(fullPrompt);
        const answer = aiResponse["lc_kwargs"].content;

        // 4. Assertions
        if (expectedKeywords.length > 0) {
            const lowerAnswer = answer.toLowerCase();
            const found = expectedKeywords.some(kw => lowerAnswer.includes(kw.toLowerCase()));
            expect(found, `Expected answer to contain at least one of: ${expectedKeywords.join(", ")}`).toBe(true);
        } else {
            // Conversational query - just check we got a response
            expect(answer.length).toBeGreaterThan(0);
        }

        // 5. Hallucination checks
        const suspiciousPhrases = ["typically", "usually", "in general", "most platforms"];
        const hallucinations = suspiciousPhrases.filter(phrase => answer.toLowerCase().includes(phrase));
        if (hallucinations.length > 0) {
            console.warn(`Potential hallucination in answer to "${question}": ${hallucinations.join(", ")}`);
        }

    }, 60000); // Long timeout for each RAG test
});
