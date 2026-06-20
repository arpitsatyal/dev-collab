export interface IAiTool {
  name: string;
  description: string;
  schema: any;
  invoke(input: any): Promise<any>;
}

export abstract class ToolRegistry {
  abstract getTools(workspaceId: string): Promise<IAiTool[]>;
}
