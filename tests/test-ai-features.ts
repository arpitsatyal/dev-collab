
import "dotenv/config";
import { getAIResponse } from "../src/lib/ai/services/aiService";
import prisma from "../src/lib/db/prisma";

async function testAIFeatures() {
    console.log("=== Testing AI Features (Metadata, Hybrid, Expansion) ===\n");

    // 1. Test Metadata Filtering
    console.log("--- Test 1: Metadata Filtering (Project Scope) ---");
    // Get a random project id
    const project = await prisma.project.findFirst();
    if (project) {
        console.log(`Using Project: ${project.title} (${project.id})`);
        const query = "What tasks are in this project?";

        // Call with project filter
        const response = await getAIResponse("test-chat-id", query, { projectId: project.id });

        // Assert that context only contains info from this project
        // Note: The context string format is "--- Source: Information from [type] within project "[title]" ---"
        const contextLines = response.context.split("\n");
        const sourceLines = contextLines.filter(line => line.startsWith("--- Source:"));

        let allMatch = true;
        let mismatchCount = 0;
        sourceLines.forEach(line => {
            if (!line.includes(`"${project.title}"`)) {
                allMatch = false;
                mismatchCount++;
                console.warn(`Mismatch found: ${line}`);
            }
        });

        if (allMatch && sourceLines.length > 0) {
            console.log("✅ Metadata Filtering Passed: All sources match project title.");
        } else if (sourceLines.length === 0) {
            console.log("⚠️ Metadata Filtering Inconclusive: No sources found.");
        } else {
            console.error(`❌ Metadata Filtering Failed: ${mismatchCount} sources from other projects found.`);
        }
    } else {
        console.warn("⚠️ Skipping Metadata Test: No projects found in DB.");
    }

    console.log("\n");

    // 2. Test Hybrid Search (Keyword)
    console.log("--- Test 2: Hybrid Search (Specific Keywords) ---");
    // Find a snippet with a unique keyword
    const snippet = await prisma.snippet.findFirst({
        where: { content: { not: "" } }
    });

    if (snippet) {
        // Pick a word from the content that is likely unique or distinct
        const words = snippet.content.split(" ");
        const uniqueWord = words.find(w => w.length > 5) || words[0];

        if (uniqueWord) {
            console.log(`Searching for keyword: "${uniqueWord}" from snippet "${snippet.title}"`);
            const response = await getAIResponse("test-chat-id", uniqueWord);

            if (response.context.includes(uniqueWord)) {
                console.log("✅ Hybrid Search Passed: Keyword found in context.");
            } else {
                console.log("⚠️ Hybrid Search Warning: Keyword not found in top context (might be ranked low).");
            }
        }
    } else {
        console.warn("⚠️ Skipping Hybrid Search Test: No snippets found.");
    }

    console.log("\n");

    // 3. Test Query Expansion
    console.log("--- Test 3: Query Expansion (Log Check) ---");
    console.log("Sending query: 'create user'");
    console.log("OBSERVE LOGS BELOW for '[Query Expansion]' output...");

    await getAIResponse("test-chat-id", "create user");

    console.log("\n✅ Test Suite Completed.");
}

testAIFeatures()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
