import "dotenv/config";
import { getAIResponse } from "../src/lib/ai/aiService";
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
    }
];

async function testRAGQuality() {
    const vectorStore = await getVectorStore();
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

        // Use the refactored getAIResponse service
        const { answer, context, validated } = await getAIResponse("test-chat-id", test.question);

        console.log(`\nLLM Response: ${answer.substring(0, 200)}...`);

        // 4. Check if response contains expected keywords
        const keywordsFound = test.expectedKeywords.filter(keyword =>
            answer.toLowerCase().includes(keyword.toLowerCase())
        );

        console.log(`Keywords found: ${keywordsFound.length}/${test.expectedKeywords.length} (${keywordsFound.join(", ")})`);

        if (validated.warning) {
            console.log(`⚠️  Validation Warning: ${validated.warning}`);
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

    if (questionsWithContext < testCases.length * 0.7) {
        console.log("❌ Many questions have no relevant context - Need more documentation or better embeddings");
    }
}

// Run it
testRAGQuality().catch(console.error);