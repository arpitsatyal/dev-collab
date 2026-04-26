import { DynamicStructuredTool } from '@langchain/core/tools';

export abstract class ToolRegistry {
  abstract getTools(workspaceId: string): Promise<DynamicStructuredTool[]>;
}
