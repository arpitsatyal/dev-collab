import prisma from "../../db/prisma";
import z from "zod";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
    buildSuggestWorkItemsMessages,
    buildImplementationPlanMessages
} from "./promptService";
import { getReasoningLLM, getReasoningStructuredLLM } from "../llmFactory";
import { getExtensionFromLanguage } from "../../../utils/languageMapper";
import {
    inferFallbackBaseName,
    normalizeBaseName
} from "../../../utils/snippetNaming";

export const WorkItemSuggestionSchema = z.object({
    title: z.string().describe("Concise title of the workItem"),
    description: z.string().describe("Clear explanation of what needs to be done"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("Priority level"),
    category: z.string().describe("Short category (e.g., 'Refactor', 'Feature')"),
});

export const WorkItemSuggestionsSchema = z.object({
    suggestions: z.array(WorkItemSuggestionSchema),
});

export type WorkItemSuggestion = z.infer<typeof WorkItemSuggestionSchema>;

const SnippetFileNameSchema = z.object({
    baseName: z
        .string()
        .describe("Short descriptive file name without extension, lowercase with underscores"),
});

export async function suggestWorkItems(workspaceId: string): Promise<WorkItemSuggestion[]> {
    // Fetch all context in parallel — deterministic, no LLM discretion
    const [workspace, workItems, snippets, docs] = await Promise.all([
        prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { title: true, description: true }
        }),
        prisma.workItem.findMany({
            where: { workspaceId },
            take: 20,
            orderBy: { createdAt: "desc" },
            select: { title: true, description: true, status: true }
        }),
        prisma.snippet.findMany({
            where: { workspaceId },
            take: 5,
            orderBy: { updatedAt: "desc" },
            select: { title: true, language: true, content: true }
        }),
        prisma.doc.findMany({
            where: { workspaceId },
            take: 3,
            orderBy: { updatedAt: "desc" },
            select: { label: true, content: true }
        }),
    ]);

    console.log(`[Suggestion Engine] Fetched context — workItems: ${workItems.length}, snippets: ${snippets.length}, docs: ${docs.length}`);

    try {
        const messages = buildSuggestWorkItemsMessages({ workspace, workspaceId, workItems, snippets, docs });
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
 * Fetches the workItem, its linked snippets, and relevant workspace-wide context.
 * Merges snippets uniquely by title.
 */
async function getRichWorkItemContext(workItemId: string) {
    const workItem = await prisma.workItem.findUnique({
        where: { id: workItemId },
        include: {
            snippets: true,
            workspace: {
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

    if (!workItem) throw new Error("Work Item not found");

    const allSnippets = [...workItem.snippets, ...(workItem.workspace?.snippets || [])];
    const uniqueSnippetsMap = new Map();
    allSnippets.forEach(s => uniqueSnippetsMap.set(s.title, s));
    const mergedSnippets = Array.from(uniqueSnippetsMap.values());

    return {
        workItem,
        contextStr: formatContextSnippets(mergedSnippets),
        workspaceContext: workItem.workspace
            ? `Workspace: ${workItem.workspace.title}\nDescription: ${workItem.workspace.description || "No description"}`
            : ""
    };
}

export async function generateImplementationPlan(workItemId: string): Promise<string> {
    try {
        const { workItem, contextStr } = await getRichWorkItemContext(workItemId);
        const messages = buildImplementationPlanMessages(workItem.title, workItem.description ?? "", contextStr);
        const llm = await getReasoningLLM();
        return await llm.pipe(new StringOutputParser()).invoke(messages);
    } catch (error) {
        console.error("[Analysis Engine] Error generating plan:", error);
        return "Failed to generate implementation plan. Please try again.";
    }
}

const buildUniqueFileName = (
    baseName: string,
    extension: string,
    existingNames: Set<string>
) => {
    const safeBase = normalizeBaseName(baseName) || "snippet";
    let candidate = `${safeBase}.${extension}`;
    let index = 1;

    while (existingNames.has(candidate.toLowerCase())) {
        candidate = `${safeBase}_${index}.${extension}`;
        index += 1;
    }

    return candidate;
};

export async function suggestSnippetFilenameForCode({
    workspaceId,
    code,
    language,
}: {
    workspaceId: string;
    code: string;
    language?: string;
}): Promise<string> {
    const normalizedLanguage = (language || "plaintext").toLowerCase();
    const extension = getExtensionFromLanguage(normalizedLanguage);

    const existing = await prisma.snippet.findMany({
        where: { workspaceId },
        select: { title: true, extension: true },
    });

    const existingNames = new Set(
        existing.map((snippet) =>
            `${snippet.title}.${snippet.extension || "txt"}`.toLowerCase()
        )
    );

    try {
        const llm = await getReasoningStructuredLLM(
            SnippetFileNameSchema,
            "suggest_snippet_filename"
        );

        const truncatedCode = code.slice(0, 3000);
        const messages = [
            new SystemMessage(
                "You generate concise software filename suggestions. Return only JSON fields that match schema."
            ),
            new HumanMessage(`Suggest a short descriptive filename base (no extension) for this ${normalizedLanguage} code snippet.
Rules:
- lowercase, underscores, alphanumeric only
- max 48 characters
- avoid generic names like file/code/snippet unless unavoidable
- return baseName only

Code:
\`\`\`${normalizedLanguage}
${truncatedCode}
\`\`\``),
        ];

        const result = await llm.invoke(messages);
        const aiBaseName = normalizeBaseName(result?.baseName || "");
        return buildUniqueFileName(
            aiBaseName || inferFallbackBaseName(code),
            extension,
            existingNames
        );
    } catch (error) {
        console.error("[Suggestion Engine] Failed to suggest snippet filename:", error);
        return buildUniqueFileName(inferFallbackBaseName(code), extension, existingNames);
    }
}
