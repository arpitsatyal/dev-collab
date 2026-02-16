import { describe, test, expect, beforeAll } from 'vitest';
import { getVectorStore } from '../src/lib/ai/vectorStore';
import { performHybridSearch } from '../src/lib/ai/services/retrievalService';
import prisma from '../src/lib/db/prisma';

describe('RAG Retrieval Quality', () => {
    let vectorStore: any;

    beforeAll(async () => {
        vectorStore = await getVectorStore();
    });

    test('should retrieve relevant documents with good similarity scores', async () => {
        const query = "What are the project objectives?";
        const results = await vectorStore.similaritySearchWithScore(query, 5);

        // Should return results
        expect(results.length).toBeGreaterThan(0);

        // Top result should have high relevance (>0.7)
        const [topDoc, topScore] = results[0];
        expect(topScore).toBeGreaterThan(0.7);

        // Should have metadata
        expect(topDoc.metadata).toBeDefined();
        expect(topDoc.pageContent).toBeTruthy();
    });

    test('should filter results by project metadata', async () => {
        const project = await prisma.project.findFirst();

        if (!project) {
            console.warn('Skipping: No projects in database');
            return;
        }

        const query = "What tasks are in this project?";
        const results = await performHybridSearch([query], query, { projectId: project.id });

        // All results should belong to the specified project
        results.forEach(([doc]: any) => {
            if (doc.metadata?.projectId) {
                expect(doc.metadata.projectId).toBe(project.id);
            }
        });
    }, 30000);

    test('should perform hybrid search (vector + keyword)', async () => {
        // Pick a specific technical term that would benefit from keyword matching
        const snippet = await prisma.snippet.findFirst({
            where: { content: { not: "" } }
        });

        if (!snippet) {
            console.warn('Skipping: No snippets in database');
            return;
        }

        // Extract a unique word from the snippet
        const words = snippet.content.split(/\s+/);
        const uniqueWord = words.find(w => w.length > 5) || words[0];

        const results = await performHybridSearch([uniqueWord], uniqueWord);

        // Should return results that include the keyword
        expect(results.length).toBeGreaterThan(0);

        // At least one result should contain the keyword (case-insensitive)
        const hasKeyword = results.some(([doc]: any) =>
            doc.pageContent.toLowerCase().includes(uniqueWord.toLowerCase())
        );
        expect(hasKeyword).toBe(true);
    }, 30000);

    test('should handle queries with multiple search variations', async () => {
        const queries = [
            "project goals",
            "project objectives",
            "SMART goals"
        ];

        const results = await performHybridSearch(queries, queries[0]);

        // Should leverage multiple query variations for better retrieval
        expect(results.length).toBeGreaterThan(0);

        // Should have reasonable relevance scores
        const avgScore = results.reduce((sum, [_, score]) => sum + score, 0) / results.length;
        expect(avgScore).toBeGreaterThan(0.6);
    }, 30000);
});
