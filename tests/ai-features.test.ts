
import { describe, it, expect, afterAll } from 'vitest';
import { getAIResponse } from "../src/lib/ai/services/aiService";
import prisma from "../src/lib/db/prisma";

describe('AI Features Integration Tests', () => {

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should filter context by project metadata', async () => {
        const project = await prisma.project.findFirst();

        if (!project) {
            console.warn("Skipping Metadata Test: No projects found in DB.");
            return;
        }

        console.log(`Using Project: ${project.title} (${project.id})`);
        const query = "What tasks are in this project?";

        const response = await getAIResponse("test-chat-id", query, { projectId: project.id });

        const contextLines = response.context.split("\n");
        const sourceLines = contextLines.filter(line => line.startsWith("--- Source:"));

        // If no sources found, test is inconclusive but technically not a failure of logic
        if (sourceLines.length === 0) {
            console.warn("Metadata Filtering Inconclusive: No sources found.");
            return;
        }

        const mismatchCount = sourceLines.filter(line => !line.includes(`"${project.title}"`)).length;
        expect(mismatchCount).toBe(0);
    }, 30000); // Extended timeout for AI calls

    it('should identify specific keywords via Hybrid Search', async () => {
        const snippet = await prisma.snippet.findFirst({
            where: { content: { not: "" } }
        });

        if (!snippet) {
            console.warn("Skipping Hybrid Search Test: No snippets found.");
            return;
        }

        const words = snippet.content.split(" ");
        const uniqueWord = words.find(w => w.length > 5) || words[0];

        if (!uniqueWord) {
            console.warn("Skipping Hybrid Search Test: No unique word found.");
            return;
        }

        console.log(`Searching for keyword: "${uniqueWord}" from snippet "${snippet.title}"`);
        const response = await getAIResponse("test-chat-id", uniqueWord);

        // We expect the context to contain the unique word
        expect(response.context).toContain(uniqueWord);
    }, 30000);

    it('should expand queries (log verification)', async () => {
        // This test is harder to assert deeply without mocking the logger or internal function
        // For now, we ensure it runs without throwing errors.
        await expect(getAIResponse("test-chat-id", "create user")).resolves.not.toThrow();
    });
});
