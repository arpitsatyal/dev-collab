import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from 'src/common/guards/auth.guard';
import { WorkItemsService } from './work-items.service';

@UseGuards(SessionAuthGuard)
@Controller('dueWorkItems')
export class DueWorkItemsController {
  constructor(private readonly workItemsService: WorkItemsService) {}

  @Get()
  getDueSoon(@Query('days') days?: string) {
    const threshold = days ? parseInt(days, 10) : 1;
    return this.workItemsService.getDueSoon(threshold);
  }
}
