import { BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { IAiMessage } from 'src/modules/ai/types/ai.types';
import { AiMessageRole } from 'src/modules/ai/enums/ai.enums';
import { IAiTool } from 'src/modules/ai/tools/ports/tools.port';

export class LangChainConversionUtils {
  static toLangChainMessage(msg: IAiMessage): BaseMessage {
    switch (msg.role) {
      case AiMessageRole.USER:
        return new HumanMessage({ content: msg.content, name: msg.name });
      case AiMessageRole.ASSISTANT:
        return new AIMessage({
          content: msg.content,
          name: msg.name,
          tool_calls: msg.tool_calls
        });
      case AiMessageRole.SYSTEM:
        return new SystemMessage({ content: msg.content, name: msg.name });
      case AiMessageRole.TOOL:
        return new ToolMessage({
          content: msg.content,
          tool_call_id: msg.tool_call_id || '',
          name: msg.name
        });
      default:
        throw new Error(`Unsupported role: ${msg.role}`);
    }
  }

  static toLangChainMessages(messages: IAiMessage[]): BaseMessage[] {
    return messages.map(this.toLangChainMessage);
  }

  static toLangChainTool(tool: IAiTool): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: tool.name,
      description: tool.description,
      schema: tool.schema,
      func: (args) => tool.invoke(args),
    });
  }

  static toLangChainTools(tools: IAiTool[]): DynamicStructuredTool[] {
    return tools.map(this.toLangChainTool);
  }
}
