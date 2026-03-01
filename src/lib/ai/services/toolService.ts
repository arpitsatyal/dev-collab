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
    description: "Fetch code snippets by their title or keywords (e.g. 'Auth Hook'). Use this tool when you need to see existing implementation patterns or match the project's coding style. If you don't know the title at all, you can omit it to see general project snippets, or use semanticSearch for conceptual queries.",
    schema: z.object({
        projectId: z.string(),
        title: z.string().optional().describe("Specific human-readable name of the snippet to search for. DO NOT place code strings here.")
    }),
    func: async ({ projectId, title }) => {
        const whereClause: any = { projectId };

        if (title) {
            whereClause.title = { contains: title, mode: 'insensitive' };
        }

        const snippets = await prisma.snippet.findMany({
            where: whereClause,
            take: 10,
            orderBy: { updatedAt: "desc" },
            select: { title: true, content: true, language: true }
        });

        if (snippets.length === 0) {
            return title
                ? `No code snippets found matching the title or keywords: '${title}'.`
                : "No code snippets have been created for this project yet.";
        }

        return JSON.stringify(snippets.map((s: any) => ({
            title: s.title,
            language: s.language,
            content: safeParseContent(s.content).slice(0, 600) + "..."
        })));
    }
});

export const getDocsTool = new DynamicStructuredTool({
    name: "getDocs",
    description: "Fetch project documentation items by their human-readable Label (e.g. 'Database Schema'). Use this tool when you want to list or catalog available documentation. If you want to list ALL docs in the project, omit 'label'. DO NOT use this tool for conceptual keyword searches — use semanticSearch for that.",
    schema: z.object({
        projectId: z.string(),
        label: z.string().optional().describe("Specific human-readable name of the document to search for. DO NOT place code or conceptual strings here.")
    }),
    func: async ({ projectId, label }) => {
        const whereClause: any = { projectId };

        if (label) {
            whereClause.label = { contains: label, mode: 'insensitive' };
        }

        const docs = await prisma.doc.findMany({
            where: whereClause,
            take: 10,
            orderBy: { updatedAt: "desc" },
            select: { label: true, content: true }
        });

        if (docs.length === 0) {
            return label
                ? `No documentation found matching the label: '${label}'.`
                : "No project documentation documents have been found for this project.";
        }

        return JSON.stringify(docs.map((d: any) => ({
            label: d.label,
            content: safeParseContent(d.content).slice(0, 600) + "..."
        })));
    }
});

export const getExistingTasksTool = new DynamicStructuredTool({
    name: "getExistingTasks",
    description: "Fetch existing tasks and their implementation status (TODO/IN_PROGRESS/DONE). If you are looking for a specific task by name, provide the 'title'. If you are looking for general project progress, omit 'title'.",
    schema: z.object({
        projectId: z.string(),
        title: z.string().optional().describe("Optional keywords or specific name of the task to search for.")
    }),
    func: async ({ projectId, title }) => {
        const whereClause: any = { projectId };

        if (title) {
            whereClause.title = { contains: title, mode: 'insensitive' };
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            take: 15,
            orderBy: { createdAt: "desc" },
            select: { title: true, description: true, status: true }
        });

        if (tasks.length === 0) {
            return title
                ? `No tasks found matching the title: '${title}'.`
                : "No tasks have been created in this project yet. Start by suggesting foundational tasks.";
        }

        return JSON.stringify(tasks.map((t: any) => ({
            title: t.title,
            description: t.description || "",
            status: t.status
        })));
    }
});

export const semanticSearchTool = new DynamicStructuredTool({
    name: "semanticSearch",
    description: "Search across all project content (snippets, docs, tasks) using semantic similarity. Use this for open-ended or conceptual questions like 'how does X work?' or 'explain the auth flow' — when you need to find relevant information without knowing exactly where it lives.",
    schema: z.object({
        projectId: z.string(),
        query: z.string().describe("The search query to find relevant content"),
    }),
    func: async ({ projectId, query }) => {
        const results = await performHybridSearch([query], query, { projectId });
        if (results.length === 0) {
            return "No relevant content found for that query.";
        }
        return results.map(([doc, score]: any) => {
            const type = doc.metadata?.type || "content";
            return `[${type}] (relevance: ${score.toFixed(2)})\n${doc.pageContent}`;
        }).join("\n\n---\n\n");
    }
});
