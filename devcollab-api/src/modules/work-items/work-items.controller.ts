import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
} from '@nestjs/common';

import { WorkItemsService } from './work-items.service';
import {
  WorkItemCreateDto,
  WorkItemUpdateStatusDto,
} from './dto/work-items.dto';
import {
  GetWorkItemsQueryDto,
  GetDueSoonQueryDto,
} from './dto/work-items-query.dto';
import { CurrentUser } from '../users/user.decorator';
import type { User } from '../../common/drizzle/schema';

@Controller('work-items')
export class WorkItemsController {
  constructor(private readonly workItemsService: WorkItemsService) {}

  @Get()
  getWorkItems(@Query() query: GetWorkItemsQueryDto) {
    return this.workItemsService.getWorkItems(query.workspaceId);
  }

  @Get('due')
  getDueSoon(@Query() query: GetDueSoonQueryDto) {
    const threshold = query.days ? parseInt(query.days, 10) : 1;
    return this.workItemsService.getDueSoon(threshold);
  }

  @Get(':workItemId')
  getWorkItem(@Param('workItemId') workItemId: string) {
    return this.workItemsService.getWorkItem(workItemId);
  }

  @Post()
  createWorkItem(
    @Query() query: GetWorkItemsQueryDto,
    @Body() body: WorkItemCreateDto,
    @CurrentUser() user: User,
  ) {
    return this.workItemsService.createWorkItem({
      workspaceId: query.workspaceId,
      authorId: user.id,
      ...body,
    });
  }

  @Patch(':workItemId/status')
  updateStatus(
    @Param('workItemId') workItemId: string,
    @Body() body: WorkItemUpdateStatusDto,
  ) {
    return this.workItemsService.updateStatus({
      id: workItemId,
      status: body.status,
    });
  }
}
