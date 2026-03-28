import { DynamicStructuredTool } from '@langchain/core/tools';

export abstract class ToolRegistry {
  abstract getToolsForWorkspace(workspaceId: string): { list: DynamicStructuredTool[] };
}
