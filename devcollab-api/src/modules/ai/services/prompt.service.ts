import { Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { PromptPort } from '../ports/prompt.port';
import { ChatScope } from '../types/ai.types';

@Injectable()
export class PromptService implements PromptPort {
  constructPrompt(context: string, history: string, question: string) {
    return ChatPromptTemplate.fromTemplate(
      `
You are DevCollab Assistant, a friendly and insightful companion for developers. Your goal is to help the user navigate their workspace with a warm and collaborative tone. 

Always provide accurate information grounded in the provided context, but present it naturally. Always ensure your response is complete and does not end abruptly. If the information is extensive, prioritize conciseness to ensure the most important points are fully articulated. Avoid listing statistics dryly; instead, weave them into a helpful narrative.

Context from the workspace:
{context}

Recent conversation:
{history}

User question:
{question}

If the information isn't in the context, politely let the user know and suggest what they might add to the workspace to help you answer better.
  `.trim(),
    ).format({
      context,
      history,
      question,
    });
  }

  buildChatMessages(history: string, question: string, workspaceId?: string) {
    let sysMsg =
      'You are DevCollab Assistant, a helpful and enthusiastic teammate. Your tone should be friendly, professional, and natural. Always ensure your response is complete and does not end abruptly. Avoid being robotic or purely formulaic.';
    if (workspaceId) {
      sysMsg += `\n\n[CONTEXT]: The user is currently in a workspace (ID: ${workspaceId}).\n\n[TONE GUIDELINE]: When summarizing tools results, don't just list counts (e.g., "5 snippets, 0 docs"). Instead, be descriptive and friendly. Talk about the project's purpose based on its title and description, and mention what's available or what's missing in a conversational way (e.g., "It looks like we're just getting started with the documentation!" or "I found some interesting code snippets for your project."). YOU ARE FORBIDDEN from guessing or using general knowledge—always use your tools first.`;
    }

    return [
      new SystemMessage(sysMsg),
      new HumanMessage(
        `Conversation history:\n${history}\n\nUser question: ${question}`,
      ),
    ];
  }

  buildIntentClassificationPrompt(
    question: string,
    history: string,
    inWorkspace?: boolean,
  ) {
    let sysMsg =
      'Classify the user intent based on the current question and conversation history.\n\n' +
      'INTENT:\n' +
      '- WORKSPACE_QUERY: Asking about data, searching, or performing actions in the workspace.\n' +
      '- CONVERSATIONAL: Casual chat, platform help, or domain-related questions.\n\n' +
      'SCOPE:\n' +
      '- APP_SPECIFIC: Refers to DevCollab data (snippets, docs, work items) or platform features/onboarding.\n' +
      '- DOMAIN_KNOWLEDGE: Questions about technical terms, platforms, or concepts mentioned in the current workspace context or recent history (e.g., "lastfm" if the workspace is about a Last.fm tool).\n' +
      '- OUT_OF_SCOPE: Completely unrelated topics (e.g., jokes, general history, hobbies).\n\n' +
      'Return JSON with fields: intent, scope, confidence (0-1). Use the history to resolve ambiguities (like "it", "this", or "that").';

    if (inWorkspace) {
      sysMsg +=
        '\n\nNOTE: The user is currently inside a workspace. If they ask about a term or platform identified as the workspace focus in the history, classify it as DOMAIN_KNOWLEDGE.';
    }

    return [
      new SystemMessage(sysMsg),
      new HumanMessage(`History:\n${history}\n\nCurrent Question: ${question}`),
    ];
  }

  buildConversationalMessages(
    history: string,
    question: string,
    scope?: ChatScope,
  ) {
    let userMessage = `Conversation history:\n${history}\n\nUser question: ${question}`;

    if (scope === 'OUT_OF_SCOPE') {
      userMessage += `\n\n[CRITICAL DIRECTIVE]: This query is OUT OF SCOPE. Politely and warmly explain that you're a specialized DevCollab workspace assistant and can't assist with this specific request. Suggest how you *could* help within the context of their workspace instead. Stay focused but friendly.`;
    } else if (scope === 'DOMAIN_KNOWLEDGE') {
      userMessage += `\n\n[DIRECTIVE]: This query is about a technical term, platform, or concept relevant to the workspace. Provide a brief, professional explanation based on your general knowledge to help the user understand the context of their project. Keep it concise.`;
    }

    return [
      new SystemMessage(
        "You are DevCollab Assistant, a friendly and helpful teammate. You specialize in DevCollab and the user's workspace. Always ensure your response is complete and does not end abruptly. Avoid being overly formal or robotic.",
      ),
      new HumanMessage(userMessage),
    ];
  }
}
