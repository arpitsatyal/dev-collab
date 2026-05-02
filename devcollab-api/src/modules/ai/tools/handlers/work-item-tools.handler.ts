import { Injectable } from '@nestjs/common';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { WorkItemsService } from 'src/modules/work-items/work-items.service';
import { WorkItemStatus } from 'src/common/drizzle/schema/enums';
import type { CreateWorkItemArgs, GetWorkItemsArgs, UpdateWorkItemArgs } from '../../interfaces/ai-tools.interfaces';

@Injectable()
export class WorkItemToolsHandler {
  constructor(private readonly workItemsService: WorkItemsService) { }

  async handleGetWorkItems(args: GetWorkItemsArgs, defaultId: string): Promise<string> {
    const { titleFilter, workspaceId: overrideId } = args;
    const workspaceId = overrideId || defaultId;
    if (!workspaceId) return 'Workspace ID is required to fetch work items.';

    const workItems = titleFilter
      ? await this.workItemsService.searchWorkItems(workspaceId, titleFilter, 20)
      : await this.workItemsService.getWorkItems(workspaceId);

    if (workItems.length === 0) {
      return titleFilter
        ? `No work items found matching the title: '${titleFilter}'.`
        : 'No work items have been created yet.';
    }

    const output = workItems.map((w: any) => ({
      id: w.id,
      title: w.title,
      description: w.description || '',
      status: w.status,
    }));
    return `Found exactly ${workItems.length} work item(s) total in the workspace.\n${JSON.stringify(output)}`;
  }

  async handleCreateWorkItem(args: CreateWorkItemArgs, defaultId: string, authorId: string): Promise<string> {
    const workspaceId = args.workspaceId || defaultId;
    try {
      const workItem = await this.workItemsService.createWorkItem({
        title: args.title,
        description: args.description,
        status: (args.status as WorkItemStatus) || 'TODO',
        workspaceId,
        authorId,
        assignedToId: args.assignedToId,
        dueDate: args.dueDate,
        snippetIds: args.snippetIds,
      });
      return `Successfully created work item: ${workItem.title} (ID: ${workItem.id})`;
    } catch (error) {
      return `Error: Failed to create work item. Technical details: ${error.message}`;
    }
  }

  async handleUpdateWorkItem(args: UpdateWorkItemArgs): Promise<string> {
    try {
      const { id, status } = args;
      if (status) {
        await this.workItemsService.updateStatus({
          id,
          status: status as WorkItemStatus,
        });
        return `Successfully updated work item status to ${status}.`;
      }
      return 'No status provided for update.';
    } catch (error) {
      return `Error: Failed to update work item. Technical details: ${error.message}`;
    }
  }

  getTools(workspaceId: string, authorId: string): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: 'get_work_items',
        description: 'Fetch ALL work items inside a workspace. Optionally filter by title.',
        schema: z.object({
          titleFilter: z.string().nullable().optional().describe('Search keyword to filter work item titles.'),
          workspaceId: z.string().nullable().optional().describe('Target workspace ID.'),
        }),
        func: (args) => this.handleGetWorkItems(args, workspaceId),
      }),
      new DynamicStructuredTool({
        name: 'create_work_item',
        description: 'Create a new task or work item.',
        schema: z.object({
          title: z.string().describe('Task title'),
          description: z.string().nullable().optional().describe('Task detail'),
          status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).nullable().optional(),
          dueDate: z.string().nullable().optional().describe('Due date as string'),
          assignedToId: z.string().nullable().optional().describe('User ID to assign to'),
          snippetIds: z.array(z.string()).nullable().optional().describe('Snippet IDs to link'),
          workspaceId: z.string().nullable().optional().describe('Target workspace ID.'),
        }),
        func: (args) => this.handleCreateWorkItem(args, workspaceId, authorId),
      }),
      new DynamicStructuredTool({
        name: 'update_work_item',
        description: 'Update an existing work item status.',
        schema: z.object({
          id: z.string().describe('The ID of the work item to update'),
          status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).nullable().optional(),
        }),
        func: (args) => this.handleUpdateWorkItem(args),
      }),
    ];
  }
}
