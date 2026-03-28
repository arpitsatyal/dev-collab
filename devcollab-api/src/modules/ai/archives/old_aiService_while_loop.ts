// @ts-nocheck
/**
 * ARCHIVED: Original while-loop based AI chat engine.
 * Replaced by LangGraph StateGraph implementation in March 2026.
 *
 * Limitations:
 *  - Hard-coded 5-iteration cap that stops arbitrarily mid-reasoning
 *  - Manual messages array state management
 *  - No observability into which step failed
 *  - No streaming, checkpointing, or human-in-the-loop support
 *  - Sequential tool execution only
 */

import { getReasoningLLM, getSpeedyLLM, getReasoningToolBoundLLM, getReasoningStructuredLLM } from "./old_llmFactory";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../../common/drizzle/schema";
import { eq, asc } from "drizzle-orm";
// Mocked initialization for archive readability
const client = postgres(process.env.DATABASE_URL || "");
const db = drizzle(client, { schema });

import { ToolMessage, AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getSnippetsTool, getDocsTool, getExistingWorkItemsTool, semanticSearchTool } from "../../../../../dev-collab-client/src/lib/ai/services/toolService";
import { performHybridSearch, generateQueryVariations } from "../../../../../dev-collab-client/src/lib/ai/services/retrievalService";
import { constructPrompt, buildChatMessages, buildIntentClassificationPrompt, buildConversationalMessages, IntentSchema } from "../../../../../dev-collab-client/src/lib/ai/services/promptService";
import { generateAnswer } from "../../../../../dev-collab-client/src/lib/ai/services/generationService";

const MAX_CHAT_ITERATIONS = 5;
const APP_SCOPE_REPLY =
    "I can assist with Dev-Collab only, including workspaces, workItems, snippets, documentation, and workspace code. Please ask a question related to your application data or workflow.";

async function getChatHistory(chatId: string): Promise<string> {
    const pastMessages = await db.query.messages.findMany({
        where: eq(schema.messages.chatId, chatId),
        orderBy: [asc(schema.messages.createdAt)],
        limit: 10,
    });
    return pastMessages
        .map((m) => (m.isUser ? `User: ${m.content}` : `AI: ${m.content}`))
        .join("\n");
}

// ── Path A: Tool-calling loop (workspace-scoped chat) ────────────────────────────
async function getAIResponseWithTools(chatId: string, question: string, workspaceId: string) {
    const tools = [getSnippetsTool, getDocsTool, getExistingWorkItemsTool, semanticSearchTool];
    const llmWithTools = await getReasoningToolBoundLLM(tools);
    const history = await getChatHistory(chatId);

    let messages: BaseMessage[] = buildChatMessages(history, question);
    let iterations = 0;

    // ── The old while loop ─────────────────────────────────────────────────────
    while (iterations < MAX_CHAT_ITERATIONS) {
        iterations++;
        const response = await llmWithTools.invoke(messages) as AIMessage;
        messages.push(response);

        if (!response.tool_calls || response.tool_calls.length === 0) {
            // LLM is done calling tools — use this message as the final answer
            console.log(`[Chat Engine] Loop ended after ${iterations} iterations.`);
            break;
        }

        console.log(`[Chat Engine] Iteration ${iterations}: executing ${response.tool_calls.length} tool(s).`);

        // Execute each requested tool call manually
        for (const toolCall of response.tool_calls) {
            const tool = tools.find(t => t.name === toolCall.name);
            if (!tool) {
                messages.push(new ToolMessage({
                    tool_call_id: toolCall.id ?? "",
                    content: `Tool "${toolCall.name}" not found.`,
                    name: toolCall.name,
                }));
                continue;
            }

            let args = toolCall.args;
            if (typeof args === "string") {
                try { args = JSON.parse(args); } catch { args = {}; }
            }

            try {
                // @ts-ignore - inject workspaceId into args
                const result = await tool.invoke({ ...args, workspaceId });
                messages.push(new ToolMessage({
                    tool_call_id: toolCall.id ?? "",
                    content: typeof result === "string" ? result : JSON.stringify(result),
                    name: toolCall.name,
                }));
            } catch (err) {
                messages.push(new ToolMessage({
                    tool_call_id: toolCall.id ?? "",
                    content: `Error executing tool: ${err}`,
                    name: toolCall.name,
                }));
            }
        }
    }

    // Final synthesis pass with a faster/cheaper model
    const msgsWithInstruction = [
        ...messages,
        new HumanMessage("Please provide your final answer to the user's question based on the information gathered."),
    ];
    const llm = await getSpeedyLLM();
    const answer = await llm.pipe(new StringOutputParser()).invoke(msgsWithInstruction);

    return { answer, context: "", validated: { isValid: true, warning: null } };
}

// ── Path B: Hybrid vector search fallback (global / no workspace) ───────────────
async function getAIResponseWithSearch(chatId: string, question: string, filters?: Record<string, any>) {
    const queryGenLlm = await getReasoningLLM();
    const queries = await generateQueryVariations(question, queryGenLlm);
    const filteredResults = await performHybridSearch(queries, question, filters);

    if (filteredResults.length === 0) {
        return {
            answer: `${APP_SCOPE_REPLY} Try referencing a workspace entity like a workItem title, snippet filename, or doc label.`,
            context: "",
            validated: { isValid: true, warning: null }
        };
    }

    filteredResults.forEach(([doc, score]: any, i: number) => {
        console.log(`Result ${i + 1}: Score: ${score.toFixed(4)}, Type: ${doc.metadata?.type}, Title: ${doc.metadata?.workspaceTitle}`);
    });

    const context = filteredResults.length > 0
        ? filteredResults.map(([doc]: any) => {
            const type = doc.metadata?.type || "General Info";
            const title = doc.metadata?.workspaceTitle || "Unknown Workspace";
            return `--- Source: Information from ${type} within workspace "${title}" ---\n${doc.pageContent}`;
        }).join("\n\n")
        : "I don't have enough specific information in my records to answer this fully.";

    const history = await getChatHistory(chatId);
    const fullPrompt = constructPrompt(context, history, question);
    const answerLlm = await getSpeedyLLM();
    return await generateAnswer(answerLlm, fullPrompt, context, filteredResults);
}

// ── Public entrypoint ─────────────────────────────────────────────────────────
export async function getAIResponse(chatId: string, question: string, filters?: Record<string, any>) {
    const classifierLlm = await getReasoningStructuredLLM(IntentSchema, "classify_intent");
    const intentMessages = buildIntentClassificationPrompt(question);

    let intent = "WORKSPACE_QUERY";
    let scope: "APP_SPECIFIC" | "OUT_OF_SCOPE" = filters?.workspaceId ? "APP_SPECIFIC" : "OUT_OF_SCOPE";

    try {
        const result = await classifierLlm.invoke(intentMessages);
        if (result.confidence > 0.4) {
            intent = result.intent;
            scope = result.scope;
        } else {
            console.warn("[Intent Classification] Low confidence, defaulting to WORKSPACE_QUERY");
        }
    } catch (e) {
        console.warn("[Intent Classification] Failed, defaulting to WORKSPACE_QUERY:", e);
    }

    if (intent === "CONVERSATIONAL") {
        if (scope === "OUT_OF_SCOPE") {
            return { answer: APP_SCOPE_REPLY, context: "", validated: { isValid: true, warning: null } };
        }
        const history = await getChatHistory(chatId);
        const conversationalMessages = buildConversationalMessages(history, question);
        const conversationalLlm = await getSpeedyLLM();
        const answer = await conversationalLlm.pipe(new StringOutputParser()).invoke(conversationalMessages);
        return { answer, context: "", validated: { isValid: true, warning: null } };
    }

    if (scope === "OUT_OF_SCOPE" && !filters?.workspaceId) {
        return { answer: APP_SCOPE_REPLY, context: "", validated: { isValid: true, warning: null } };
    }

    if (filters?.workspaceId) {
        return getAIResponseWithTools(chatId, question, filters.workspaceId);
    }
    return getAIResponseWithSearch(chatId, question, filters);
}
