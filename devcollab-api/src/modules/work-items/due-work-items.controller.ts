import { Controller, Get, Query } from '@nestjs/common';
import { WorkItemsService } from './work-items.service';
import { GetDueSoonQueryDto } from './dto/work-items-query.dto';

@Controller('dueWorkItems')
export class DueWorkItemsController {
  constructor(private readonly workItemsService: WorkItemsService) {}

  @Get()
  getDueSoon(@Query() query: GetDueSoonQueryDto) {
    const threshold = query.days ? parseInt(query.days, 10) : 1;
    return this.workItemsService.getDueSoon(threshold);
  }
}
