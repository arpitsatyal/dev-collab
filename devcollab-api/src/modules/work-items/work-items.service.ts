import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { QueuePort } from 'src/modules/queue/ports/queue.port';
import {
  WorkItemCreateDto,
  WorkItemUpdateStatusDto,
} from './dto/work-items.dto';
import dayjs from 'dayjs';
import { SyncEventPort } from 'src/common/sync-events/ports/sync-event.port';
import { WorkItemRepository } from './repositories/work-item.repository';
import { WorkItemStatus } from 'src/common/drizzle/schema';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { users } from 'src/common/drizzle/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class WorkItemsService {
  constructor(
    private readonly queueClient: QueuePort,
    private readonly syncPort: SyncEventPort,
    private readonly workItemRepo: WorkItemRepository,
    private readonly drizzle: DrizzleService,
  ) {}

  async getWorkItems(workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID is required');
    }

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

  async createWorkItem(
    workspaceId: string,
    authorId: string,
    dto: WorkItemCreateDto,
  ) {
    const workItem = await this.workItemRepo.create({
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: (dto.status as WorkItemStatus) ?? 'TODO',
      workspaceId,
      assignedToId: dto.assignedToId,
      authorId,
      snippetIds: dto.snippetIds,
    });

    // Notify assignee if present
    if (workItem.assignedToId) {
      const assignee = await this.drizzle.db.query.users.findFirst({
        where: eq(users.id, workItem.assignedToId),
      });

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

  async updateStatus(workItemId: string, dto: WorkItemUpdateStatusDto) {
    const updatedWorkItem = await this.workItemRepo.update(workItemId, {
      status: dto.status as WorkItemStatus,
    });

    if (updatedWorkItem.assignedToId) {
      const assignee = await this.drizzle.db.query.users.findFirst({
        where: eq(users.id, updatedWorkItem.assignedToId),
      });

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
}
