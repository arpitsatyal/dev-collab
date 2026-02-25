import { getLLMWithFallback } from "../llmFactory";
import prisma from "../../db/prisma";
import {
    buildSuggestWorkItemsMessages,
    buildImplementationPlanMessages,
    buildDraftChangesMessages
} from "./promptService";

export interface WorkItemSuggestion {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    category: string;
}

export async function suggestWorkItems(projectId: string): Promise<WorkItemSuggestion[]> {
    const llm = await getLLMWithFallback();

    // 1. Fetch context (Snippets, Docs, Existing Tasks, and Project Details)
    const [snippets, docs, existingTasks, project] = await Promise.all([
        prisma.snippet.findMany({
            where: { projectId },
            take: 5,
            orderBy: { updatedAt: "desc" },
            select: { title: true, content: true, language: true }
        }),
        prisma.doc.findMany({
            where: { projectId },
            take: 3,
            orderBy: { updatedAt: "desc" },
            select: { label: true, content: true }
        }),
        prisma.task.findMany({
            where: { projectId },
            take: 10,
            orderBy: { createdAt: "desc" },
            select: { title: true }
        }),
        prisma.project.findUnique({
            where: { id: projectId },
            select: { title: true, description: true }
        })
    ]);

    const safeParseContent = (content: any): string => {
        if (typeof content !== 'string') return JSON.stringify(content);
        try {
            const parsed = JSON.parse(content);
            return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
        } catch (e) {
            return content;
        }
    };

    const projectContext = project
        ? `PROJECT: ${project.title}\nDESCRIPTION: ${project.description || "No description provided."}`
        : "";

    const snippetsDocsContext = [
        ...snippets.map((s: any) => {
            const contentString = safeParseContent(s.content);
            return `Snippet: ${s.title} (${s.language})\nContent: ${contentString.slice(0, 400)}...`;
        }),
        ...docs.map((d: any) => `Document: ${d.label}\nSummary: ${JSON.stringify(d.content).slice(0, 400)}...`)
    ].join("\n\n");

    const contextStr = [projectContext, snippetsDocsContext].filter(Boolean).join("\n\n");
    const existingTasksStr = existingTasks.map((t: any) => `- ${t.title}`).join("\n");

    // 2. Build messages via promptService and invoke LLM
    try {
        const response = await llm.invoke(buildSuggestWorkItemsMessages(contextStr, existingTasksStr));
        let content = response["lc_kwargs"].content as string;

        // More robust JSON extraction and cleaning
        // 1. Remove markdown backticks
        content = content.replace(/```json|```/g, "").trim();

        // 2. Locate the JSON array
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        let jsonStr = jsonMatch ? jsonMatch[0] : content;

        // 3. CRITICAL: Handle unescaped newlines in JSON strings which LLMs often generate
        jsonStr = jsonStr.replace(/"([^"]*)"/g, (match, p1) => {
            return '"' + p1.replace(/\n/g, "\\n") + '"';
        });

        try {
            return JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("[Suggestion Engine] JSON Parse Error. Cleaned Content was:", jsonStr);
            return [];
        }
    } catch (error) {
        console.error("[Suggestion Engine] Error generating suggestions:", error);
        return [];
    }
}

export async function generateImplementationPlan(taskId: string): Promise<string> {
    const llm = await getLLMWithFallback();

    // 1. Fetch Task and linked context
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            snippets: true,
            project: true
        }
    });

    if (!task) throw new Error("Work Item not found");

    const contextStr = task.snippets.map(s =>
        `--- Snippet: ${s.title} (${s.language}) ---\n${s.content}`
    ).join("\n\n");

    // 2. Build messages via promptService and invoke LLM
    try {
        const response = await llm.invoke(
            buildImplementationPlanMessages(task.title, task.description ?? "", contextStr)
        );
        return response["lc_kwargs"].content as string;
    } catch (error) {
        console.error("[Analysis Engine] Error generating plan:", error);
        return "Failed to generate implementation plan. Please try again.";
    }
}

export async function generateDraftChanges(taskId: string): Promise<string> {
    const llm = await getLLMWithFallback();

    // 1. Fetch Task, linked snippets, and project context
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            snippets: true,
            project: true
        }
    });

    if (!task) throw new Error("Work Item not found");

    const contextStr = task.snippets.map(s =>
        `--- Snippet: ${s.title} (${s.language}) ---\n${s.content}`
    ).join("\n\n");

    const projectContext = task.project
        ? `Project: ${task.project.title}\nDescription: ${task.project.description || "No description"}`
        : "";

    // 2. Build messages via promptService and invoke LLM
    try {
        const response = await llm.invoke(
            buildDraftChangesMessages(task.title, task.description ?? "", projectContext, contextStr)
        );
        return response["lc_kwargs"].content as string;
    } catch (error) {
        console.error("[Drafting Engine] Error generating draft:", error);
        return "Failed to generate draft changes. Please try again.";
    }
}
