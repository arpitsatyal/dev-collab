import z from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import prisma from "../../db/prisma";
import { performHybridSearch } from "./retrievalService";

const safeParseContent = (content: any): string => {
    if (typeof content !== 'string') return JSON.stringify(content);
    try {
        const parsed = JSON.parse(content);
        return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
    } catch (e) {
        return content;
    }
};

export const getSnippetsTool = new DynamicStructuredTool({
    name: "getSnippets",
    description: "Fetch ALL code snippets in the project. Use this to list what snippets exist or find a specific snippet by its EXACT known title. If you are NOT 100% sure of the exact title, DO NOT provide it — omit it and all snippets will be returned. Never guess a title.",
    schema: z.object({
        title: z.string().optional().describe("ONLY provide if you know the EXACT title of the snippet. If unsure, omit this field entirely.")
    }),
    func: async ({ title }, _runManager, config) => {
        const projectId = config?.configurable?.projectId as string;
        console.log(`[Tool: getSnippets] 🔍 Invoked with title: "${title || 'N/A'}", projectId: "${projectId || 'GLOBAL'}"`);
        const whereClause: any = projectId ? { projectId } : {};

        if (title) {
            whereClause.title = { contains: title, mode: 'insensitive' };
        }

        const snippets = await prisma.snippet.findMany({
            where: whereClause,
            take: 100,
            orderBy: { updatedAt: "desc" },
            select: { title: true, content: true, language: true }
        });

        console.log(`[Tool: getSnippets] ✅ Found ${snippets.length} snippets.`);

        if (snippets.length === 0) {
            return title
                ? `No code snippets found matching the title or keywords: '${title}'.`
                : "No code snippets have been created yet.";
        }

        const output = snippets.map((s: any) => ({
            title: s.title,
            language: s.language,
            content: safeParseContent(s.content).slice(0, 400) + "..."
        }));
        return `Found exactly ${snippets.length} snippet(s) total in the workspace.\n${JSON.stringify(output)}`;
    }
});

export const getDocsTool = new DynamicStructuredTool({
    name: "getDocs",
    description: "Fetch ALL project documentation. If you want a specific doc by its exact known name, provide 'label'. If you are NOT 100% sure of the exact label, DO NOT provide it — omit it and all docs will be returned. Never guess or infer the label from the user's question.",
    schema: z.object({
        label: z.string().optional().describe("ONLY provide if you know the EXACT label name of the document. If unsure, omit this field entirely.")
    }),
    func: async ({ label }, _runManager, config) => {
        const projectId = config?.configurable?.projectId as string;
        console.log(`[Tool: getDocs] Invoked with label: "${label || 'N/A'}", projectId: "${projectId || 'GLOBAL'}"`);
        const whereClause: any = projectId ? { projectId } : {};

        if (label) {
            whereClause.label = { contains: label, mode: 'insensitive' };
        }

        const docs = await prisma.doc.findMany({
            where: whereClause,
            take: 100,
            orderBy: { updatedAt: "desc" },
            select: { label: true, content: true }
        });

        console.log(`[Tool: getDocs] ✅ Found ${docs.length} docs.`);

        if (docs.length === 0) {
            return label
                ? `No documentation found matching the label: '${label}'.`
                : "No documentation documents have been found.";
        }

        const output = docs.map((d: any) => ({
            label: d.label,
            content: safeParseContent(d.content).slice(0, 400) + "..."
        }));
        return `Found exactly ${docs.length} doc(s) total in the workspace.\n${JSON.stringify(output)}`;
    }
});

export const getExistingTasksTool = new DynamicStructuredTool({
    name: "getExistingTasks",
    description: "Fetch ALL tasks and their status (TODO/IN_PROGRESS/DONE). Use this to list what work exists in the project. If you want a specific task by its EXACT known title, provide it. If you are NOT 100% sure of the exact title, DO NOT provide it — omit it and all tasks will be returned. Never guess a title.",
    schema: z.object({
        title: z.string().optional().describe("ONLY provide if you know the EXACT title of the task. If unsure, omit this field entirely.")
    }),
    func: async ({ title }, _runManager, config) => {
        const projectId = config?.configurable?.projectId as string;
        console.log(`[Tool: getExistingTasks] 🔍 Invoked with title: "${title || 'N/A'}", projectId: "${projectId || 'GLOBAL'}"`);
        const whereClause: any = projectId ? { projectId } : {};

        if (title) {
            whereClause.title = { contains: title, mode: 'insensitive' };
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            take: 100,
            orderBy: { createdAt: "desc" },
            select: { title: true, description: true, status: true }
        });

        console.log(`[Tool: getExistingTasks] ✅ Found ${tasks.length} tasks.`);

        if (tasks.length === 0) {
            return title
                ? `No tasks found matching the title: '${title}'.`
                : "No tasks have been created yet.";
        }

        const output = tasks.map((t: any) => ({
            title: t.title,
            description: t.description || "",
            status: t.status
        }));
        return `Found exactly ${tasks.length} task(s) total in the workspace.\n${JSON.stringify(output)}`;
    }
});

export const semanticSearchTool = new DynamicStructuredTool({
    name: "semanticSearch",
    description: "Search across all project content using semantic/conceptual similarity. Use ONLY for open-ended or conceptual questions like 'how does authentication work?' or 'explain the payment flow' — when you need to find relevant content without knowing its exact name. Do NOT use this as a shortcut when getSnippets, getDocs, or getExistingTasks would give a more precise answer.",
    schema: z.object({
        query: z.string().describe("A natural language question or concept to search for. Be specific and descriptive.")
    }),
    func: async ({ query }, _runManager, config) => {
        const projectId = config?.configurable?.projectId as string;
        console.log(`[Tool: semanticSearch] Invoked with query: "${query}", projectId: "${projectId}"`);

        const results = await performHybridSearch([query], query, { projectId });
        console.log(`[Tool: semanticSearch] ✅ Found ${results.length} results: ${results.map(([doc]: any) => doc.metadata?.type || 'unknown').join(', ')}`);

        if (results.length === 0) {
            return "No relevant content found for that query.";
        }
        return results.map(([doc, score]: any) => {
            const type = doc.metadata?.type || "content";
            return `[${type}] (relevance: ${score.toFixed(2)})\n${doc.pageContent}`;
        }).join("\n\n---\n\n");
    }
});
