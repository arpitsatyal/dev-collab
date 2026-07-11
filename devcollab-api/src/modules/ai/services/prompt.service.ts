import { Injectable } from '@nestjs/common';
import { PromptPort } from '../ports/prompt.port';
import { IAiMessage, ChatScope } from '../types/ai.types';
import { AiMessageRole } from '../enums/ai.enums';

@Injectable()
export class PromptService implements PromptPort {
  constructPrompt(context: string, history: string, question: string) {
    return `
You are DevCollab Assistant, a friendly and insightful companion for developers. Your goal is to help the user navigate their workspace with a warm and collaborative tone. 

Always provide accurate information grounded in the provided context, but present it naturally. Always ensure your response is complete and does not end abruptly. If the information is extensive, prioritize conciseness to ensure the most important points are fully articulated. Avoid listing statistics dryly; instead, weave them into a helpful narrative.

Context from the workspace:
${context}

Recent conversation:
${history}

User question:
${question}

If the information isn't in the context, politely let the user know and suggest what they might add to the workspace to help you answer better.
  `.trim();
  }

  buildChatMessages(history: string, question: string, workspaceId?: string): IAiMessage[] {
    let sysMsg =
      'You are DevCollab Assistant, a helpful and enthusiastic teammate. You are currently interacting with an end-user (not a developer) via a Chat Interface. Your tone should be friendly, natural, and helpful. ALWAYS speak in plain English and talk about application features. YOU ARE FORBIDDEN from mentioning internal function names or tool names (e.g., do not say "create_doc" or "search_snippets"). Instead, say "You can create a new document" or "I can search your snippets for you."';
    if (workspaceId) {
      sysMsg += `\n\n[CONTEXT]: The user is currently in a workspace (ID: ${workspaceId}).\n\n[ACTION GUIDELINE]: You have tools to both SEARCH and ACT. If the user asks "How do I..." or a question about the app, explain the feature in plain English. Only use SEARCH tools if needed for context. DO NOT use ACTION tools unless the user explicitly commands it. NEVER mention technical tool/function names to the user.`;
    }

    return [
      { role: AiMessageRole.SYSTEM, content: sysMsg },
      {
        role: AiMessageRole.USER,
        content: `Conversation history:\n${history}\n\nUser question: ${question}`,
      },
    ];
  }

  buildIntentClassificationPrompt(
    question: string,
    history: string,
    inWorkspace?: boolean,
  ): IAiMessage[] {
    let sysMsg =
      'Classify the user intent based on the current question and conversation history.\n\n' +
      'INTENT:\n' +
      '- WORKSPACE_QUERY: Asking about specific data, searching code/docs, or performing actions in the current workspace.\n' +
      '- CONVERSATIONAL: Casual chat, general help about using the platform, "how-to" questions, or broad technical discussions.\n\n' +
      'SCOPE:\n' +
      '- APP_SPECIFIC: Refers to DevCollab data (snippets, docs, work items) or platform features/onboarding.\n' +
      '- DOMAIN_KNOWLEDGE: Questions about technical terms, platforms, or concepts mentioned in the current workspace context or recent history (e.g., "lastfm" if the workspace is about a Last.fm tool).\n' +
      '- OUT_OF_SCOPE: Completely unrelated topics (e.g., jokes, general history, hobbies).\n\n' +
      'Return JSON with fields: intent, scope, confidence (0-1). Use the history to resolve ambiguities (like "it", "this", or "that").';

    if (inWorkspace) {
      sysMsg +=
        '\n\nNOTE: The user is currently inside a workspace. If they ask about a term or platform identified as the workspace focus in the history, classify it as DOMAIN_KNOWLEDGE.';
    } else {
      sysMsg +=
        '\n\nNOTE: The user is currently in the global dashboard (NOT inside a workspace). Classify the intent as CONVERSATIONAL for general help or onboarding questions. Only use WORKSPACE_QUERY if they explicitly ask to search across all their workspace data.';
    }

    return [
      { role: AiMessageRole.SYSTEM, content: sysMsg },
      { role: AiMessageRole.USER, content: `History:\n${history}\n\nCurrent Question: ${question}` },
    ];
  }

  buildConversationalMessages(
    history: string,
    question: string,
    scope?: ChatScope,
  ): IAiMessage[] {
    let userMessage = `Conversation history:\n${history}\n\nUser question: ${question}`;

    if (scope === 'OUT_OF_SCOPE') {
      userMessage += `\n\n[CRITICAL DIRECTIVE]: This query is OUT OF SCOPE. Politely and warmly explain that you're a specialized DevCollab workspace assistant and can't assist with this specific request. Suggest how you *could* help within the context of their workspace instead. Stay focused but friendly.`;
    } else if (scope === 'DOMAIN_KNOWLEDGE') {
      userMessage += `\n\n[DIRECTIVE]: This query is about a technical term, platform, or concept relevant to the workspace. Provide a brief, professional explanation based on your general knowledge to help the user understand the context of their project. Keep it concise.`;
    }

    return [
      {
        role: AiMessageRole.SYSTEM,
        content: "You are DevCollab Assistant, a friendly and helpful teammate. You are interacting with an end-user via a Chat Interface. Speak in plain English and talk about application features. NEVER mention internal tool/function names (like create_doc).",
      },
      { role: AiMessageRole.USER, content: userMessage },
    ];
  }
}
