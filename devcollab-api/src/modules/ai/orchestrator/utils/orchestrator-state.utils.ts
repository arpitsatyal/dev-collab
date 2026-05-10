import { AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages';

/**
 * Static utility for safely selecting data from the Agent Message State.
 * This encapsulates the "manual array indexing" logic to ensure
 * type safety and consistency across all nodes and edges.
 */
export class OrchestratorStateUtils {
  /**
   * Returns the absolute last message in the sequence.
   */

  private static getLastMessage(messages: BaseMessage[]): BaseMessage | undefined {
    if (!messages.length) return undefined;
    return messages[messages.length - 1];
  }

  /**
   * Safely returns the last message ONLY if it is an AI Message.
   * Returns undefined if the last message is a Human or Tool message.
   */
  static getLastAIMessage(messages: BaseMessage[]): AIMessage | undefined {
    const last = this.getLastMessage(messages);
    return last && AIMessage.isInstance(last) ? last : undefined;
  }

  /**
   * Checks if the agent has requested any tool executions.
   */
  static hasToolCalls(messages: BaseMessage[]): boolean {
    const last = this.getLastAIMessage(messages);
    return !!(last?.tool_calls && last.tool_calls.length > 0);
  }

  /**
   * Returns the names of all tools requested in the last step.
   */
  static getToolNames(messages: BaseMessage[]): string[] {
    return this.getLastToolCalls(messages).map((tc) => tc.name);
  }

  /**
   * Returns the raw tool_calls array from the last AI message.
   */
  static getLastToolCalls(messages: BaseMessage[]): any[] {
    const last = this.getLastAIMessage(messages);
    return last?.tool_calls || [];
  }

  /**
   * Returns the sequence of names for all tools that have actually 
   * been executed in the conversation so far.
   */
  static getToolSequence(messages: BaseMessage[]): string[] {
    return messages
      .filter((m) => ToolMessage.isInstance(m))
      .map((m: any) => m.name)
      .filter(Boolean);
  }

  /**
   * Safely extracts a string representation of the message content.
   * Handles multi-modal arrays and potential undefined states.
   */
  static getContent(message?: BaseMessage): string {
    if (!message) return 'No response generated.';

    const content = message.content;

    // Standard string content
    if (typeof content === 'string') {
      if (!content && AIMessage.isInstance(message) && message.tool_calls?.length) {
        const tools = message.tool_calls.map((tc) => tc.name).join(', ');
        return `I plan to use the following tools: ${tools}`;
      }
      return content || 'Empty response.';
    }

    // Multi-part content (common in vision or structured models)
    if (Array.isArray(content)) {
      return content
        .map((part) => (typeof part === 'string' ? part : JSON.stringify(part)))
        .join('\n');
    }

    // Fallback for complex objects
    return JSON.stringify(content);
  }
}
