
import { getVectorStore } from "../vectorStore";
import prisma from "../../db/prisma";

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
