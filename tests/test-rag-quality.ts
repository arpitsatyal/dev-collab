import "dotenv/config";
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
        expectedKeywords: ["Total Projects", "count"],
        category: "stats"
    },
    {
        question: "What is the Collaborative Playground and what can I do there?",
        expectedKeywords: ["collaborative", "code editor", "sharing", "real-time"],
        category: "features"
    }
];

async function testRAGQuality() {
    const vectorStore = await getVectorStore();
    const llm = getLLM();
    const scoreThreshold = 0.5;

    console.log("=== RAG Quality Test ===\n");

    let totalRetrievalScore = 0;
    let questionsWithGoodRetrieval = 0;
    let questionsWithContext = 0;

    for (const test of testCases) {
        console.log(`\n--- Testing: "${test.question}" ---`);

        // 1. Test retrieval quality
        const resultsWithScores = await vectorStore.similaritySearchWithScore(test.question, 5);
        const filteredResults = resultsWithScores.filter(([doc, score]) => score >= scoreThreshold);

        const avgScore = resultsWithScores.length > 0
            ? resultsWithScores.reduce((sum, [_, score]) => sum + score, 0) / resultsWithScores.length
            : 0;

        totalRetrievalScore += avgScore;

        console.log(`Retrieval - Total: ${resultsWithScores.length}, Filtered: ${filteredResults.length}, Avg Score: ${avgScore.toFixed(3)}`);

        if (avgScore >= 0.7) questionsWithGoodRetrieval++;
        if (filteredResults.length > 0) questionsWithContext++;

        // 2. Show top results
        resultsWithScores.slice(0, 3).forEach(([doc, score], i) => {
            console.log(`  ${i + 1}. Score: ${score.toFixed(3)} - ${doc.pageContent.substring(0, 80)}...`);
        });

        // 3. Test LLM response
        const context = filteredResults.length > 0
            ? filteredResults.map(([doc, score]) => {
                const type = doc.metadata?.type || 'General';
                const title = doc.metadata?.projectTitle || 'N/A';
                return `[Source: ${type} in Project: ${title}] (Relevance: ${score.toFixed(2)})\n${doc.pageContent}`;
            }).join("\n---\n")
            : "No direct information found in documentation for this specific query.";

        const fullPrompt = `You are a helpful and friendly AI Assistant for the Dev-Collab platform.

Your goal is to assist users with their questions about projects, documentation, and tasks while maintaining a warm, professional persona.

GROUNDING GUIDELINES:
1. INFORMATIONAL QUESTIONS: If the user is asking about specific project data, features, or documentation, use the "DATA CONTEXT" below as your primary source.
2. NO DATA FOUND: If the "DATA CONTEXT" doesn't contain the specific answer for a factual question, politely state that it's not in your current records and offer general helpful advice.
3. CONVERSATIONAL INTERACTION: If the user provides feedback, greetings, or short acknowledgments (e.g., "Hi", "Thanks", "Cooool"), respond naturally as a friendly assistant. You do NOT need to reference the "DATA CONTEXT" for these interactions.

DATA CONTEXT:
${context}

USER QUESTION:
${test.question}

YOUR RESPONSE:`;

        const aiResponse = await llm.invoke(fullPrompt);
        const answer = aiResponse["lc_kwargs"].content;

        console.log(`\nLLM Response: ${answer.substring(0, 200)}...`);

        // 4. Check if response contains expected keywords (if any)
        if (test.expectedKeywords.length > 0) {
            const keywordsFound = test.expectedKeywords.filter(keyword =>
                answer.toLowerCase().includes(keyword.toLowerCase())
            );
            console.log(`Keywords found: ${keywordsFound.length}/${test.expectedKeywords.length} (${keywordsFound.join(", ")})`);
        } else {
            console.log("No keywords expected (conversational query).");
        }

        // 5. Check for hallucination indicators
        const suspiciousPhrases = ["typically", "usually", "in general", "most platforms", "you can also"];
        const hallucinations = suspiciousPhrases.filter(phrase =>
            answer.toLowerCase().includes(phrase)
        );

        if (hallucinations.length > 0) {
            console.log(`⚠️  Possible hallucination detected: "${hallucinations.join('", "')}"`);
        }
    }

    // Summary
    console.log("\n\n=== SUMMARY ===");
    console.log(`Average retrieval score: ${(totalRetrievalScore / testCases.length).toFixed(3)}`);
    console.log(`Questions with good retrieval (>0.7): ${questionsWithGoodRetrieval}/${testCases.length}`);
    console.log(`Questions with any context: ${questionsWithContext}/${testCases.length}`);
    console.log(`Questions with no context: ${testCases.length - questionsWithContext}/${testCases.length}`);

    // Recommendations
    console.log("\n=== RECOMMENDATIONS ===");
    if (totalRetrievalScore / testCases.length < 0.6) {
        console.log("❌ Low retrieval scores - Consider improving embeddings");
    } else if (totalRetrievalScore / testCases.length < 0.75) {
        console.log("⚠️  Moderate retrieval scores - Embeddings could be better");
    } else {
        console.log("✅ Good retrieval scores - Embeddings are working well");
    }
}

// Run it
testRAGQuality().catch(console.error);