import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';

import { DocsService } from './docs.service';
import { DocCreateDto, DocUpdateDto } from './dto/docs.dto';

@Controller('workspaces/:workspaceId/docs')
export class DocsController {
  constructor(private docsService: DocsService) {}

  @Get()
  getDocs(@Param('workspaceId') workspaceId: string) {
    return this.docsService.getDocs(workspaceId);
  }

  @Get(':docId')
  getDocById(@Param('docId') docId: string) {
    return this.docsService.getDoc(docId);
  }

  @Post()
  createDoc(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: DocCreateDto,
  ) {
    return this.docsService.createDoc({
      workspaceId,
      ...dto,
    });
  }

  @Patch(':docId')
  updateDoc(@Param('docId') docId: string, @Body() dto: DocUpdateDto) {
    return this.docsService.updateDoc({
      id: docId,
      ...dto,
    });
  }
}
