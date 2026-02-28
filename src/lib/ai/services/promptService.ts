
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

// Helper for Query Expansion
export async function generateQueryVariations(query: string, llm: BaseChatModel): Promise<string[]> {
    const prompt = `You are an AI assistant helping to expand a user's search query.
    Generate 3 alternative versions of the following query to improve search retrieval. 
    Focus on synonyms, related concepts, and technical terms relevant to software development.
    Return ONLY the 3 queries, one per line, without any numbering or extra text.
    
    Query: "${query}"`;

    try {
        const content = await llm.pipe(new StringOutputParser()).invoke(prompt);
        const variations = content.split('\n').filter(q => q.trim().length > 0).slice(0, 3);
        return [query, ...variations];
    } catch (e) {
        console.warn("[Query Expansion] Failed:", e);
        return [query];
    }
}

export function constructPrompt(context: string, history: string, question: string) {
    return `You are a helpful and friendly AI Assistant for the Dev-Collab platform.
    
Your goal is to assist users with their questions about projects, documentation, and tasks while maintaining a warm, professional persona.

GROUNDING GUIDELINES:
1. INFORMATIONAL QUESTIONS: If the user is asking about specific project data, features, or documentation, use the "DATA CONTENT" below as your primary source.
2. NO DATA FOUND: If the "DATA CONTENT" doesn't contain the specific answer for a factual question, politely state that it's not in your current records and offer general helpful advice.
3. CONVERSATIONAL INTERACTION: If the user provides feedback, greetings, or short acknowledgments (e.g., "Hi", "Thanks", "Cooool"), respond naturally as a friendly assistant. You do NOT need to reference the "DATA CONTENT" for these interactions.

TONE & STYLE:
- Speak naturally. Never use technical terms like "relevance", "data context", "provided records", or "context score" in your response to the user.
- Instead of saying "based on the context provided", just state the information directly (e.g., "There are currently three projects...").
- Keep your answers clean, focused, and free of meta-talk about how you found the information.

CHAIN OF THOUGHT (Internal Monologue):
Before answering, silently analyze:
1. What is the user *really* asking? (Debug help? Code snippet? Project status?)
2. Do I have the relevant info in "DATA CONTENT"?
3. If yes, extract key details. If no, prepare a polite fallback.

FEW-SHOT EXAMPLES:

User: "How do I create a task?"
Context: "To create a task, go to the project board and click 'New Task'."
AI: "To create a new task, simply navigate to your project board and click the 'New Task' button at the top right."

User: "Show me the login code."
Context: "Snippet Title: Auth Logic\nContent: const login = () => { ... }"
AI: "Here is the login logic from your 'Auth Logic' snippet:\n\`\`\`javascript\nconst login = () => { ... }\n\`\`\`"

DATA CONTENT:
${context}

CONVERSATION HISTORY:
${history}

USER QUESTION:
${question}

YOUR RESPONSE:`;
}

// ─── Suggestion Engine Prompts ─────────────────────────────────────────────

export function buildSuggestWorkItemsMessages(projectContext: string) {
    const systemPrompt = `You are a Senior Project Manager and Technical Architect.
You suggest high-value work items based on project context.

RECOMMENDED WORKFLOW — gather context before suggesting:
1. Call getExistingTasks to see current tasks and their status.
2. Call getSnippets to check if code has already been implemented (it will tell you if nothing exists).
3. Call getDocs to check if any documentation or requirements exist (it will tell you if nothing exists).
Use whatever context you find to make informed, non-duplicate suggestions.

RULES:
- Always respond with ONLY a valid JSON array. No markdown. No explanation.
- Each object must have: title, description, priority (LOW/MEDIUM/HIGH), category.
- Tasks with status DONE or IN_PROGRESS are ALREADY IMPLEMENTED. Never suggest them or anything closely related.
- Tasks with status TODO are planned — avoid duplicating those too.
- If snippets show a feature is already coded, do not suggest building it again.
- Suggest exactly 3 NEW items that do not overlap with anything already implemented or in progress.
- DO NOT USE NEWLINES INSIDE THE JSON DESCRIPTION STRING.

Example output:
[
  {
    "title": "Add input validation to auth endpoints",
    "description": "Currently POST /login has no schema validation...",
    "priority": "HIGH",
    "category": "Security"
  }
]`;

    const userPrompt = `Here is the project context:

${projectContext || "Minimal context available. Please suggest general foundational tasks based on the project goal if provided."}

Please analyze the project using your tools and suggest 3 high-value work items.`;

    return [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
}

export function buildImplementationPlanMessages(title: string, description: string, contextStr: string) {
    const systemPrompt = "You are a Senior Software Engineer and Mentor. You provide deep technical analysis and structured implementation plans.";

    const userPrompt = `Goal: Generate a technical implementation plan for the following Work Item.

Work Item: "${title}"
Description: ${description || "No description provided."}

The user has attached the following code context:
${contextStr || "No code context attached."}

INSTRUCTIONS:
1. RESTRICTION: Use ONLY the provided code context. Do not invent external libraries unless they are obvious standards.
2. FORMAT: Provide a structured Markdown plan.
3. INCLUDE:
   - High-level approach.
   - Step-by-step code changes (use diff-style or clear snippets).
   - Potential edge cases or risks.
4. COMPLETENESS: Ensure all code blocks are complete and NOT truncated. Provide the full logic for all suggested changes.
5. EXCLUSION: Do NOT include "Next Steps", "Future Enhancements", "Further Reading", or any interactive to-do lists.

Tone: Professional, concise, and helpful.`;

    return [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
}

export function buildDraftChangesMessages(title: string, description: string, projectContext: string, contextStr: string) {
    const systemPrompt = "You are an Expert Software Implementation Engineer. You generate production-grade code changes based on work items and project context.";

    const userPrompt = `Goal: Draft the specific code changes required to implement the following Work Item.

Work Item: "${title}"
Description: ${description || "No description provided."}

PROJECT CONTEXT:
${projectContext}

CURRENT CODE SNIPPETS (CONTEXT):
${contextStr || "No specific code context attached. Draft based on general best practices for this type of task."}

INSTRUCTIONS:
Before writing any code, follow these reasoning steps:
1. Briefly explain what the work item requires based on the context.
2. Identify which files or functions need to change and why.
3. Consider potential side effects or dependencies.

Then, provide the implementation:
1. Generate a clean, production-ready "Draft Diff" or specific code blocks.
2. If specific snippets are provided, show how they would be modified.
3. If no snippets are provided, draft the new component or utility logic from scratch.
4. Use standard modern coding patterns (Hooks for React, Prisma for DB, etc.).
5. Focus on the core logic and critical parts of the implementation.
6. COMPLETENESS: Do NOT truncate code blocks. Ensure the output is a complete, valid implementation.
7. NEGATIVE CONSTRAINT: Do NOT include any conversation, "Next steps", or placeholder comments.

RESPONSE FORMAT:
Provide your response in clear Markdown.
Start with your reasoning section (points 1-3 above), then provide the code blocks with clear file names.`;

    return [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
}
