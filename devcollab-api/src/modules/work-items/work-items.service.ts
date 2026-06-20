import { Injectable, NotFoundException } from '@nestjs/common';
import { QueuePort } from 'src/modules/queue/ports/queue.port';
import dayjs from 'dayjs';
import { SyncEventPort } from 'src/common/sync-events/ports/sync-event.port';
import { WorkItemRepository } from './repositories/work-item.repository';
import { WorkItemStatus } from 'src/common/drizzle/schema/enums';
import { UserRepository } from '../users/repositories/user.repository';
import type {
  CreateWorkItemRequest,
  UpdateWorkItemStatusRequest,
} from './types/work-items.types';

@Injectable()
export class WorkItemsService {
  constructor(
    private readonly queueClient: QueuePort,
    private readonly syncPort: SyncEventPort,
    private readonly workItemRepo: WorkItemRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async getWorkItems(workspaceId: string) {
    return this.workItemRepo.findByWorkspaceId(workspaceId);
  }

  async getWorkItem(workItemId: string) {
    const item = await this.workItemRepo.findById(workItemId);
    if (!item)
      throw new NotFoundException(`Work item with id ${workItemId} not found`);
    return item;
  }

  async update(id: string, data: any) {
    return this.workItemRepo.update(id, data);
  }

  async createWorkItem(request: CreateWorkItemRequest) {
    const { status = 'TODO', ...data } = request;

    const workItem = await this.workItemRepo.create({
      ...data,
      status,
    });

    if (workItem.assignedToId) {
      const assignee = await this.userRepo.findById(workItem.assignedToId);

      if (assignee?.email) {
        await this.queueClient.sendMessage({
          assigneeEmail: assignee.email,
          assigneeName: assignee.name ?? 'Team Member',
          workspaceId: workItem.workspaceId,
          workItemTitle: workItem.title,
          workItemDescription: workItem.description ?? '',
          dueDate: workItem.dueDate
            ? dayjs(workItem.dueDate).format('MMMM D, YYYY')
            : null,
          emailType: 'workItemCreated',
        });
      }
    }

    await this.syncPort.publishSyncEvent('workItem', workItem);
    return workItem;
  }

  async updateWorkItem(request: any) {
    const { id, ...data } = request;
    const updated = await this.workItemRepo.update(id, data);

    if (!updated) throw new NotFoundException('Work item not found');

    await this.syncPort.publishSyncEvent('workItem', updated);
    return updated;
  }

  async updateStatus(request: UpdateWorkItemStatusRequest) {
    const { id, status } = request;
    const updatedWorkItem = await this.workItemRepo.update(id, {
      status: status as WorkItemStatus,
    });

    if (updatedWorkItem.assignedToId) {
      const assignee = await this.userRepo.findById(
        updatedWorkItem.assignedToId,
      );

      if (assignee?.email) {
        await this.queueClient.sendMessage({
          assigneeEmail: assignee.email,
          assigneeName: assignee.name ?? 'Team Member',
          workspaceId: updatedWorkItem.workspaceId,
          workItemTitle: updatedWorkItem.title,
          status: updatedWorkItem.status,
          emailType: 'workItemUpdated',
        });
      }
    }

    await this.syncPort.publishSyncEvent('workItem', updatedWorkItem);
    return updatedWorkItem;
  }

  async getDueSoon(thresholdDays = 1) {
    const now = dayjs();
    const thresholdDate = now.add(thresholdDays, 'day');

    return this.workItemRepo.findDueSoon(now.toDate(), thresholdDate.toDate());
  }

  async searchWorkItems(workspaceId: string, query: string, limit?: number) {
    return this.workItemRepo.findManyBySearch(workspaceId, query, limit);
  }
}
