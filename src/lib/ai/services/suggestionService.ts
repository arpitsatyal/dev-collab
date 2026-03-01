import prisma from "../../db/prisma";
import z from "zod";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
    buildSuggestWorkItemsMessages,
    buildImplementationPlanMessages
} from "./promptService";
import { getReasoningLLM, getReasoningStructuredLLM } from "../llmFactory";

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
        const structuredLlm = await getReasoningStructuredLLM(WorkItemSuggestionsSchema, "suggest_work_items");
        const result = await structuredLlm.invoke(messages);
        return result?.suggestions || [];
    } catch (error) {
        console.error("[Suggestion Engine] Error generating suggestions:", error);
        return [];
    }
}


// Helper to format snippets for prompt context
function formatContextSnippets(snippets: any[]): string {
    return snippets.map((s: any) => [
        `### Snippet: ${s.title}`,
        `Language: ${s.language}`,
        `\`\`\`${s.language}`,
        s.content,
        `\`\`\``
    ].join("\n")).join("\n\n");
}

/**
 * Fetches the task, its linked snippets, and relevant project-wide context.
 * Merges snippets uniquely by title.
 */
async function getRichTaskContext(taskId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            snippets: true,
            project: {
                include: {
                    snippets: {
                        take: 5,
                        orderBy: { updatedAt: "desc" },
                        select: { title: true, language: true, content: true }
                    }
                }
            }
        }
    });

    if (!task) throw new Error("Work Item not found");

    const allSnippets = [...task.snippets, ...(task.project?.snippets || [])];
    const uniqueSnippetsMap = new Map();
    allSnippets.forEach(s => uniqueSnippetsMap.set(s.title, s));
    const mergedSnippets = Array.from(uniqueSnippetsMap.values());

    return {
        task,
        contextStr: formatContextSnippets(mergedSnippets),
        projectContext: task.project
            ? `Project: ${task.project.title}\nDescription: ${task.project.description || "No description"}`
            : ""
    };
}

export async function generateImplementationPlan(taskId: string): Promise<string> {
    try {
        const { task, contextStr } = await getRichTaskContext(taskId);
        const messages = buildImplementationPlanMessages(task.title, task.description ?? "", contextStr);
        const llm = await getReasoningLLM();
        return await llm.pipe(new StringOutputParser()).invoke(messages);
    } catch (error) {
        console.error("[Analysis Engine] Error generating plan:", error);
        return "Failed to generate implementation plan. Please try again.";
    }
}
