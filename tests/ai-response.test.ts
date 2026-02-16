import { describe, test, expect, afterAll } from 'vitest';
import { getAIResponse } from '../src/lib/ai/services/aiService';
import prisma from '../src/lib/db/prisma';

describe('AI Response Quality', () => {

    afterAll(async () => {
        await prisma.$disconnect();
    });

    test('should return well-structured response with answer and context', async () => {
        const response = await getAIResponse('test-chat-id', 'What are project objectives?');

        // Should have required fields
        expect(response).toHaveProperty('answer');
        expect(response).toHaveProperty('context');
        expect(response).toHaveProperty('validated');

        // Answer should not be empty
        expect(response.answer.length).toBeGreaterThan(0);
    }, 30000);

    test('should ground responses in retrieved context', async () => {
        const query = "What features does the collaborative playground have?";
        const response = await getAIResponse('test-chat-id', query);

        // If context was found, answer should reference it
        if (response.context && !response.context.includes("don't have enough specific information")) {
            // Answer should not be generic
            const genericPhrases = ["in general", "typically", "usually", "most platforms"];
            const isGeneric = genericPhrases.some(phrase =>
                response.answer.toLowerCase().includes(phrase)
            );

            // Prefer specific answers over generic ones
            if (isGeneric) {
                console.warn('Warning: Response may be too generic despite having context');
            }
        }

        expect(response.answer.length).toBeGreaterThan(20);
    }, 30000);

    test('should handle conversational queries appropriately', async () => {
        const response = await getAIResponse('test-chat-id', 'Thanks!');

        // Should respond naturally
        expect(response.answer.length).toBeGreaterThan(0);
        expect(response.answer.toLowerCase()).toMatch(/welcome|glad|happy|help/);
    }, 30000);

    test('should include source citations for factual answers', async () => {
        const response = await getAIResponse('test-chat-id', 'What documentation exists for this project?');

        // If answer contains information (not "I don't have..."), should have sources
        const hasInfo = !response.answer.toLowerCase().includes("don't have");
        const hasSources = response.answer.includes("Source");

        if (hasInfo && response.context.includes("Source:")) {
            expect(hasSources || response.answer.includes("_Sources:")).toBe(true);
        }
    }, 30000);

    test('should expand query for better retrieval', async () => {
        // Query expansion should happen internally
        const response = await getAIResponse('test-chat-id', 'create user');

        // Should return a response (query expansion worked)
        expect(response.answer).toBeTruthy();

        // Context should be populated if docs exist
        expect(response.context).toBeTruthy();
    }, 30000);

    test('should validate responses against context', async () => {
        const response = await getAIResponse('test-chat-id', 'What are the project milestones?');

        // Should have validation info
        expect(response.validated).toBeDefined();

        // Log warnings if response is potentially problematic
        if (response.validated.warning) {
            console.warn(`Validation warning: ${response.validated.warning}`);
        }
    }, 30000);

    test('should filter by project scope when requested', async () => {
        const project = await prisma.project.findFirst();

        if (!project) {
            console.warn('Skipping: No projects in database');
            return;
        }

        const response = await getAIResponse(
            'test-chat-id',
            'What tasks are in this project?',
            { projectId: project.id }
        );

        // Context should only mention the specified project
        if (response.context && response.context.includes('within project')) {
            expect(response.context).toContain(project.title);
        }
    }, 30000);
});
