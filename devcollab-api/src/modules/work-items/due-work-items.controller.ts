import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from 'src/common/guards/auth.guard';
import { WorkItemsService } from './work-items.service';
import { GetDueSoonQueryDto } from './dto/work-items-query.dto';

@UseGuards(SessionAuthGuard)
@Controller('dueWorkItems')
export class DueWorkItemsController {
  constructor(private readonly workItemsService: WorkItemsService) {}

  @Get()
  getDueSoon(@Query() query: GetDueSoonQueryDto) {
    const threshold = query.days ? parseInt(query.days, 10) : 1;
    return this.workItemsService.getDueSoon(threshold);
  }
}
