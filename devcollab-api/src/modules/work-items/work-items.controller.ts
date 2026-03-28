import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from 'src/common/guards/auth.guard';
import { WorkItemsService } from './work-items.service';
import {
  WorkItemCreateDto,
  WorkItemUpdateStatusDto,
} from './dto/work-items.dto';
import { CurrentUser } from '../users/user.decorator';
import type { User } from '../../common/drizzle/schema';

@Controller('work-items')
@UseGuards(SessionAuthGuard)
export class WorkItemsController {
  constructor(private readonly workItemsService: WorkItemsService) { }

  @Get()
  getWorkItems(@Query('workspaceId') workspaceId: string) {
    return this.workItemsService.getWorkItems(workspaceId);
  }

  @Get('due')
  getDueSoon(@Query('days') days?: string) {
    const threshold = days ? parseInt(days, 10) : 1;
    return this.workItemsService.getDueSoon(threshold);
  }

  @Get(':workItemId')
  getWorkItem(@Param('workItemId') workItemId: string) {
    return this.workItemsService.getWorkItem(workItemId);
  }

  @Post()
  createWorkItem(
    @Query('workspaceId') workspaceId: string,
    @Body() body: WorkItemCreateDto,
    @CurrentUser() user: User,
  ) {
    const authorId = user.id;
    return this.workItemsService.createWorkItem(workspaceId, authorId, body);
  }

  @Patch(':workItemId/status')
  updateStatus(
    @Param('workItemId') workItemId: string,
    @Body() body: WorkItemUpdateStatusDto,
  ) {
    return this.workItemsService.updateStatus(workItemId, body);
  }
}
