import { getToolBoundLLMWithFallback, getStructuredLLMWithFallback, getLLMWithFallback } from "../llmFactory";
import prisma from "../../db/prisma";
import z from "zod";
import { ToolMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { getSnippetsTool, getDocsTool, getExistingTasksTool } from "./toolService";
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
    const tools = [getSnippetsTool, getDocsTool, getExistingTasksTool];
    const toolsByName = Object.fromEntries(tools.map(t => [t.name, t]));

    // Bind tools to the LLMs safely using factory before fallback wrapping
    const llmWithTools = await getToolBoundLLMWithFallback(tools);

    // 2. Fetch Base Project Info & Create Initial Messages
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true, description: true }
    });

    const projectContext = project
        ? `PROJECT: ${project.title}\nDESCRIPTION: ${project.description || "No description provided."}\nPROJECT_ID: ${projectId}`
        : `PROJECT_ID: ${projectId}`;

    let messages: BaseMessage[] = buildSuggestWorkItemsMessages(projectContext);

    const calledTools: string[] = [];

    try {
        // 3. The Tool-Calling Loop
        while (true) {
            // Wait for the LLM to either call a tool or finish
            const response = await llmWithTools.invoke(messages) as AIMessage;
            messages.push(response);

            // If no tool calls, it's done gathering information
            if (!response.tool_calls || response.tool_calls.length === 0) {
                break;
            }

            // Execute the requested tools
            for (const toolCall of response.tool_calls) {
                calledTools.push(toolCall.name);
                const tool = toolsByName[toolCall.name];
                if (!tool) {
                    messages.push(new ToolMessage({
                        content: `Error: Tool ${toolCall.name} not found.`,
                        tool_call_id: toolCall.id!
                    }));
                    continue;
                }

                // Inject the projectId forcefully just to be safe if the LLM hallucinated it
                const args = { ...toolCall.args, projectId };
                const result = await tool.invoke(args);

                messages.push(new ToolMessage({
                    content: result,
                    tool_call_id: toolCall.id!
                }));
            }
        }

        if (calledTools.length === 0) {
            console.log("[Suggestion Engine] LLM skipped all tools and responded directly.");
        } else {
            console.log(`[Suggestion Engine] Tools called (${calledTools.length}): ${calledTools.join(" → ")}`);
        }

        // 4. Try to parse the final AIMessage content directly via LangChain's JsonOutputParser
        console.log("[Suggestion Engine] Finished tool calling. Extracting final content...");
        const lastMessage = messages[messages.length - 1];
        if (lastMessage instanceof AIMessage && typeof lastMessage.content === "string" && lastMessage.content.trim()) {
            try {
                const jsonParser = new JsonOutputParser();
                const parsed = await jsonParser.invoke(lastMessage);
                const candidates = Array.isArray(parsed) ? parsed : parsed?.suggestions;
                if (Array.isArray(candidates) && candidates.length > 0) {
                    const validated = WorkItemSuggestionsSchema.safeParse({ suggestions: candidates });
                    if (validated.success) {
                        return validated.data.suggestions;
                    }
                }
            } catch {
                // Not directly parseable — fall through to structured LLM
            }
        }

        // 5. Fall back: Force Structured Output for the final formatting
        console.log("[Suggestion Engine] Direct parse failed. Invoking structured LLM...");
        const structuredLlm = await getStructuredLLMWithFallback(WorkItemSuggestionsSchema, "suggest_work_items");
        const finalResult = await structuredLlm.invoke(messages);
        return finalResult?.suggestions || [];

    } catch (error) {
        console.error("[Suggestion Engine] Error during tool calling:", error);
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
