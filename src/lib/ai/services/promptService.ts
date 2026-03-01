
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

// ─── Shared Base Constants ──────────────────────────────────────────────────
const BASE_PERSONA = "You are a helpful and friendly AI Assistant for the Dev-Collab platform.";
const BASE_FORMATTING = "Format your response using Markdown: use **bold** for key terms, *italics* for emphasis, `code` for identifiers/snippets, and bullet lists for multiple items.";

const PLAN_RESTRICTIONS = `
INSTRUCTIONS:
1. RESTRICTION: Use ONLY the provided code context. Do not invent external libraries unless they are obvious standards.
2. COMPLETENESS: Ensure all code blocks are complete and NOT truncated. Provide the full logic for all suggested changes.
3. EXCLUSION: Do NOT include "Next Steps", "Future Enhancements", "Further Reading", or any interactive to-do lists.`;

const CODE_BLOCK_RULES = `
CODE BLOCK RULES:
- Every code block MUST use fenced triple-backtick syntax with a language identifier on the opening line (e.g., \`\`\`typescript).
- Always specify the exact language (typescript, javascript, python, json, bash, css, html, sql, prisma, diff).
- For shell commands use \`\`\`bash. For diffs use \`\`\`diff.
- NEVER use indented code blocks without fences.`;

const LANGUAGE_MATCHING_RULE = "Use the provided code snippets in the context below to identify the project's coding style and language. Write all new code in the SAME language(s). Do not switch to a different language unless explicitly required.";

const SHARED_TONE = "Tone: Professional, concise, and helpful.";

function formatWorkItem(title: string, description: string) {
    return `Work Item: "${title}"\nDescription: ${description || "No description provided."}`;
}


export function buildChatMessages(history: string, question: string) {
    const systemPrompt = `${BASE_PERSONA}
Your goal is to assist users with their questions about projects, tasks, code snippets, and documentation.

GUIDELINES:
- For factual questions about project data, call the relevant tool first, then answer using what you find.
- Never mention tool names or internal mechanics in your response to the user.
- Speak naturally. State information directly without meta-talk like "based on the context provided".
- ${BASE_FORMATTING}

CONVERSATION HISTORY:
${history || "No previous messages."}`;

    return [
        new SystemMessage(systemPrompt),
        new HumanMessage(question),
    ];
}



export function constructPrompt(context: string, history: string, question: string) {
    return `${BASE_PERSONA}
    
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

type SuggestionContext = {
    project: { title: string; description: string | null } | null;
    projectId: string;
    tasks: { title: string; description: string | null; status: string }[];
    snippets: { title: string; language: string; content: string }[];
    docs: { label: string; content: unknown }[];
};

export function buildSuggestWorkItemsMessages({ project, projectId, tasks, snippets, docs }: SuggestionContext) {
    const systemPrompt = `You are a Senior Project Manager and Technical Architect.
Your job is to suggest 3 high-value, non-duplicate work items for a software project.

RULES:
- Respond with ONLY a valid JSON array. No markdown, no explanation.
- Each object must have: title, description, priority (LOW/MEDIUM/HIGH), category.
- Tasks with status DONE or IN_PROGRESS are ALREADY IMPLEMENTED — never suggest them or close variants.
- Tasks with status TODO are already planned — do not duplicate them.
- If snippets show a feature is coded, do not suggest building it again.
- Suggest exactly 3 NEW items that do not overlap with anything in the context below.
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

    const projectSection = project
        ? `Project: ${project.title}\nDescription: ${project.description || "No description provided."}`
        : `Project ID: ${projectId}`;

    const tasksSection = tasks.length > 0
        ? tasks.map(t => `- [${t.status}] ${t.title}${t.description ? `: ${t.description}` : ""}`).join("\n")
        : "No existing tasks.";

    const snippetsSection = snippets.length > 0
        ? snippets.map(s => `### ${s.title} (${s.language})\n\`\`\`${s.language}\n${s.content.slice(0, 500)}\n\`\`\``).join("\n\n")
        : "No code snippets.";

    const docsSection = docs.length > 0
        ? docs.map(d => `### ${d.label}`).join("\n")
        : "No documentation.";

    const userPrompt = `## PROJECT
${projectSection}

## EXISTING TASKS (avoid duplicating these)
${tasksSection}

## CODE SNIPPETS (already implemented — do not re-suggest)
${snippetsSection}

## DOCUMENTATION
${docsSection}

Suggest exactly 3 new high-value work items based on the above context.`;

    return [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
}


export function buildImplementationPlanMessages(title: string, description: string, contextStr: string) {
    const systemPrompt = "You are a Senior Software Engineer and Mentor. You provide deep technical analysis and structured implementation plans.";

    const userPrompt = `Goal: Generate a technical implementation plan for the following Work Item.

${formatWorkItem(title, description)}

The user has attached the following code context:
${contextStr || "No code context attached."}

${PLAN_RESTRICTIONS}
4. FORMAT: Provide a structured Markdown plan.
5. INCLUDE:
   - High-level approach.
   - Step-by-step code changes (use diff-style or clear snippets).
   - Potential edge cases or risks.

${CODE_BLOCK_RULES}

7. LANGUAGE MATCHING: ${LANGUAGE_MATCHING_RULE}

${SHARED_TONE}`;

    return [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
}



export const IntentSchema = z.object({
    intent: z.enum(["CONVERSATIONAL", "PROJECT_QUERY", "GLOBAL_SEARCH"]),
    confidence: z.number().min(0).max(1),
    reasoning: z.string()
});

export function buildIntentClassificationPrompt(question: string) {
    const systemPrompt = `You are a strict JSON intent classification engine.
Your goal is to categorize the user's input based on:
1. CONVERSATIONAL: Greetings, pleasantries, general chat, or simple acknowledgments (e.g., "Hi", "Hello", "Thanks", "How are you?").
2. PROJECT_QUERY: Questions about the project, code, tasks, documentation, or requests for help with software development.
3. GLOBAL_SEARCH: The user wants to generally search the whole application (if there is no specific project context implied).

Always populate your reasoning before your final decision so you can think step-by-step. Let your reasoning dictate your final intent categorization.`;

    return [
        new SystemMessage(systemPrompt),
        new HumanMessage(`User Input: "${question}"`),
    ];
}

export function buildConversationalMessages(history: string, question: string) {
    const systemPrompt = `${BASE_PERSONA}
    
Respond to the user's conversational input naturally and politely.
Do not invent project details. Keep your response concise, warm, and professional.

CONVERSATION HISTORY:
${history || "No previous messages."}`;

    return [
        new SystemMessage(systemPrompt),
        new HumanMessage(question)
    ];
}
