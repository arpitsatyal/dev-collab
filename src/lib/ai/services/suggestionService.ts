import { getStructuredLLMWithFallback, getLLMWithFallback } from "../llmFactory";
import prisma from "../../db/prisma";
import z from "zod";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
    buildSuggestWorkItemsMessages,
    buildImplementationPlanMessages,
    buildDraftChangesMessages
} from "./promptService";

export const WorkItemSuggestionSchema = z.object({
    title: z.string().describe("Concise title of the task"),
    description: z.string().describe("Clear explanation of what needs to be done"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("Priority level"),
    category: z.string().describe("Short category (e.g., 'Refactor', 'Feature')"),
});

export const WorkItemSuggestionsSchema = z.object({
    suggestions: z.array(WorkItemSuggestionSchema),
});

export type WorkItemSuggestion = z.infer<typeof WorkItemSuggestionSchema>;

export async function suggestWorkItems(projectId: string): Promise<WorkItemSuggestion[]> {
    // Fetch all context in parallel — deterministic, no LLM discretion
    const [project, tasks, snippets, docs] = await Promise.all([
        prisma.project.findUnique({
            where: { id: projectId },
            select: { title: true, description: true }
        }),
        prisma.task.findMany({
            where: { projectId },
            take: 20,
            orderBy: { createdAt: "desc" },
            select: { title: true, description: true, status: true }
        }),
        prisma.snippet.findMany({
            where: { projectId },
            take: 5,
            orderBy: { updatedAt: "desc" },
            select: { title: true, language: true, content: true }
        }),
        prisma.doc.findMany({
            where: { projectId },
            take: 3,
            orderBy: { updatedAt: "desc" },
            select: { label: true, content: true }
        }),
    ]);

    console.log(`[Suggestion Engine] Fetched context — tasks: ${tasks.length}, snippets: ${snippets.length}, docs: ${docs.length}`);

    try {
        const messages = buildSuggestWorkItemsMessages({ project, projectId, tasks, snippets, docs });
        const structuredLlm = await getStructuredLLMWithFallback(WorkItemSuggestionsSchema, "suggest_work_items");
        const result = await structuredLlm.invoke(messages);
        return result?.suggestions || [];
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

    const contextStr = task.snippets.map(s => [
        `### Snippet: ${s.title}`,
        `Language: ${s.language}`,
        `\`\`\`${s.language}`,
        s.content,
        `\`\`\``
    ].join("\n")).join("\n\n");

    // 2. Build messages via promptService and invoke LLM
    try {
        return await llm.pipe(new StringOutputParser()).invoke(
            buildImplementationPlanMessages(task.title, task.description ?? "", contextStr)
        );
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

    const contextStr = task.snippets.map(s => [
        `### Snippet: ${s.title}`,
        `Language: ${s.language}`,
        `\`\`\`${s.language}`,
        s.content,
        `\`\`\``
    ].join("\n")).join("\n\n");

    const projectContext = task.project
        ? `Project: ${task.project.title}\nDescription: ${task.project.description || "No description"}`
        : "";

    // 2. Build messages via promptService and invoke LLM
    try {
        return await llm.pipe(new StringOutputParser()).invoke(
            buildDraftChangesMessages(task.title, task.description ?? "", projectContext, contextStr)
        );
    } catch (error) {
        console.error("[Drafting Engine] Error generating draft:", error);
        return "Failed to generate draft changes. Please try again.";
    }
}
