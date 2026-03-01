
import { getVectorStore } from "../vectorStore";
import prisma from "../../db/prisma";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Helper for Query Expansion
export async function generateQueryVariations(query: string, llm: BaseChatModel): Promise<string[]> {
    const prompt = `You are an AI assistant helping to expand a user's search query.
    Generate 3 alternative versions of the following query to improve search retrieval. 
    Focus on synonyms, related concepts, and technical terms relevant to software development.
    Return ONLY the 3 queries, one per line, without any numbering or extra text.
    
    Query: "${query}"`;

    try {
        const content = await llm.pipe(new StringOutputParser()).invoke(prompt);
        const variations = content.split('\n').filter(q => q.trim().length > 0).slice(0, 3);
        return [query, ...variations];
    } catch (e) {
        console.warn("[Query Expansion] Failed:", e);
        return [query];
    }
}

// Helper for database keyword search (Hybrid Search)
async function keywordSearch(query: string, filters?: Record<string, any>) {
    const results: any[] = [];
    const projectId = filters?.projectId;

    try {
        // Projects
        if (!projectId) { // If filtering by project, we don't need to search for other projects
            const projects = await prisma.project.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 3
            });
            results.push(...projects.map(p => ({
                pageContent: `Project Title: ${p.title}\nDescription: ${p.description || "No description"}`,
                metadata: { type: 'project', projectId: p.id, projectTitle: p.title }
            })));
        }

        if (projectId) {
            // Tasks
            const tasks = await prisma.task.findMany({
                where: {
                    projectId,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 3,
                include: { project: true }
            });
            results.push(...tasks.map(t => ({
                pageContent: `Task Title: ${t.title}\nStatus: ${t.status}\nDescription: ${t.description || "No description"}`,
                metadata: { type: 'task', projectId: t.projectId, projectTitle: t.project.title }
            })));

            // Snippets
            const snippets = await prisma.snippet.findMany({
                where: {
                    projectId,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { content: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 3,
                include: { project: true }
            });
            results.push(...snippets.map(s => ({
                pageContent: `Snippet Title: ${s.title}\nLanguage: ${s.language}\nContent:\n${s.content}`,
                metadata: { type: 'snippet', projectId: s.projectId, projectTitle: s.project.title }
            })));

            // Docs
            const docs = await prisma.doc.findMany({
                where: {
                    projectId,
                    label: { contains: query, mode: 'insensitive' }
                },
                take: 3,
                include: { project: true }
            });
            results.push(...docs.map(d => {
                const contentStr = typeof d.content === 'string' ? d.content : JSON.stringify(d.content || {});
                return {
                    pageContent: `Doc Label: ${d.label}\nContent:\n${contentStr}`,
                    metadata: { type: 'doc', projectId: d.projectId, projectTitle: d.project.title }
                }
            }));
        }

    } catch (e) {
        console.error("Keyword search failed:", e);
    }
    return results;
}

export async function performHybridSearch(queries: string[], originalQuery: string, filters?: Record<string, any>) {
    const vectorStore = await getVectorStore();
    const scoreThreshold = 0.5;

    // 1. Vector Search (Parallel for all variations)
    const vectorSearchPromises = queries.map(q =>
        vectorStore.similaritySearchWithScore(q, 5, filters as any)
    );

    const vectorResultsArrays = await Promise.all(vectorSearchPromises);
    const allVectorResults = vectorResultsArrays.flat(); // Flatten results

    // Deduplicate vector results based on content/ID
    const combinedResults = [] as any[];
    const seenContent = new Set<string>();

    allVectorResults.forEach(([doc, score]) => {
        const signature = doc.pageContent.substring(0, 50); // Use first 50 chars as signature
        if (!seenContent.has(signature)) {
            seenContent.add(signature);
            combinedResults.push([doc, score]);
        }
    });

    // 2. Keyword Search (Only on original query to save DB load)
    const keywordResults = await keywordSearch(originalQuery, filters);

    // 3. Combine Results (Simple strategy: Append keyword results if not near duplicates)
    keywordResults.forEach(doc => {
        // Simple deduplication check based on content substring
        const isDuplicate = combinedResults.some(([vDoc]) =>
            vDoc.pageContent.includes(doc.pageContent.substring(0, 50))
        );
        if (!isDuplicate) {
            combinedResults.push([doc, 0.9] as any); // Assign 0.9 score to keyword matches
        }
    });

    // Sort by score (descending)
    combinedResults.sort((a, b) => b[1] - a[1]);

    // Top 10
    const finalResults = combinedResults.filter(([doc, score]) => score >= scoreThreshold).slice(0, 10);

    return finalResults;
}
