import z from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import prisma from "../../db/prisma";

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
    description: "Fetch code snippets already implemented in this project. Call this to check what code already exists before making suggestions.",
    schema: z.object({ projectId: z.string() }),
    func: async ({ projectId }) => {
        const snippets = await prisma.snippet.findMany({
            where: { projectId },
            take: 5,
            orderBy: { updatedAt: "desc" },
            select: { title: true, content: true, language: true }
        });

        if (snippets.length === 0) {
            return "No code snippets have been created for this project yet.";
        }

        return JSON.stringify(snippets.map(s => ({
            title: s.title,
            language: s.language,
            content: safeParseContent(s.content).slice(0, 600) + "..."
        })));
    }
});

export const getDocsTool = new DynamicStructuredTool({
    name: "getDocs",
    description: "Fetch project documentation and requirements. Call this to check what has already been designed or documented for this project.",
    schema: z.object({ projectId: z.string() }),
    func: async ({ projectId }) => {
        const docs = await prisma.doc.findMany({
            where: { projectId },
            take: 3,
            orderBy: { updatedAt: "desc" },
            select: { label: true, content: true }
        });

        if (docs.length === 0) {
            return "No project documentation documents have been found for this project.";
        }

        return JSON.stringify(docs.map(d => ({
            label: d.label,
            content: safeParseContent(d.content).slice(0, 600) + "..."
        })));
    }
});

export const getExistingTasksTool = new DynamicStructuredTool({
    name: "getExistingTasks",
    description: "Fetch existing tasks and their implementation status (TODO/IN_PROGRESS/DONE). Call this to avoid suggesting already planned or completed work.",
    schema: z.object({ projectId: z.string() }),
    func: async ({ projectId }) => {
        const tasks = await prisma.task.findMany({
            where: { projectId },
            take: 15,
            orderBy: { createdAt: "desc" },
            select: { title: true, description: true, status: true }
        });

        if (tasks.length === 0) {
            return "No tasks have been created in this project yet. Start by suggesting foundational tasks.";
        }

        return JSON.stringify(tasks.map(t => ({
            title: t.title,
            description: t.description || "",
            status: t.status
        })));
    }
});
