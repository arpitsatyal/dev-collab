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

import { getReasoningLLM, getSpeedyLLM, getReasoningToolBoundLLM, getReasoningStructuredLLM } from "../llmFactory";
import prisma from "../../db/prisma";
import { ToolMessage, AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getSnippetsTool, getDocsTool, getExistingTasksTool, semanticSearchTool } from "../services/toolService";
import { performHybridSearch, generateQueryVariations } from "../services/retrievalService";
import { constructPrompt, buildChatMessages, buildIntentClassificationPrompt, buildConversationalMessages, IntentSchema } from "../services/promptService";
import { generateAnswer } from "../services/generationService";

const MAX_CHAT_ITERATIONS = 5;
const APP_SCOPE_REPLY =
    "I can assist with Dev-Collab only, including projects, tasks, snippets, documentation, and workspace code. Please ask a question related to your application data or workflow.";

async function getChatHistory(chatId: string): Promise<string> {
    const pastMessages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 10,
    });
    return pastMessages
        .map((m) => (m.isUser ? `User: ${m.content}` : `AI: ${m.content}`))
        .join("\n");
}

// ── Path A: Tool-calling loop (project-scoped chat) ────────────────────────────
async function getAIResponseWithTools(chatId: string, question: string, projectId: string) {
    const tools = [getSnippetsTool, getDocsTool, getExistingTasksTool, semanticSearchTool];
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
                // @ts-ignore - inject projectId into args
                const result = await tool.invoke({ ...args, projectId });
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

// ── Path B: Hybrid vector search fallback (global / no project) ───────────────
async function getAIResponseWithSearch(chatId: string, question: string, filters?: Record<string, any>) {
    const queryGenLlm = await getReasoningLLM();
    const queries = await generateQueryVariations(question, queryGenLlm);
    const filteredResults = await performHybridSearch(queries, question, filters);

    if (filteredResults.length === 0) {
        return {
            answer: `${APP_SCOPE_REPLY} Try referencing a project entity like a task title, snippet filename, or doc label.`,
            context: "",
            validated: { isValid: true, warning: null }
        };
    }

    filteredResults.forEach(([doc, score]: any, i: number) => {
        console.log(`Result ${i + 1}: Score: ${score.toFixed(4)}, Type: ${doc.metadata?.type}, Title: ${doc.metadata?.projectTitle}`);
    });

    const context = filteredResults.length > 0
        ? filteredResults.map(([doc]: any) => {
            const type = doc.metadata?.type || "General Info";
            const title = doc.metadata?.projectTitle || "Unknown Project";
            return `--- Source: Information from ${type} within project "${title}" ---\n${doc.pageContent}`;
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

    let intent = "PROJECT_QUERY";
    let scope: "APP_SPECIFIC" | "OUT_OF_SCOPE" = filters?.projectId ? "APP_SPECIFIC" : "OUT_OF_SCOPE";

    try {
        const result = await classifierLlm.invoke(intentMessages);
        if (result.confidence > 0.4) {
            intent = result.intent;
            scope = result.scope;
        } else {
            console.warn("[Intent Classification] Low confidence, defaulting to PROJECT_QUERY");
        }
    } catch (e) {
        console.warn("[Intent Classification] Failed, defaulting to PROJECT_QUERY:", e);
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

    if (scope === "OUT_OF_SCOPE" && !filters?.projectId) {
        return { answer: APP_SCOPE_REPLY, context: "", validated: { isValid: true, warning: null } };
    }

    if (filters?.projectId) {
        return getAIResponseWithTools(chatId, question, filters.projectId);
    }
    return getAIResponseWithSearch(chatId, question, filters);
}
