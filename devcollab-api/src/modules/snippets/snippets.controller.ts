import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from 'src/common/guards/auth.guard';
import { SnippetsService } from './snippets.service';
import { SnippetsCreateDto, SnippetsUpdateDto } from './dto/snippets.dto';
import { CurrentUser } from '../users/user.decorator';
import type { User } from '../../common/drizzle/schema';

@Controller('workspaces/:workspaceId/snippets')
@UseGuards(SessionAuthGuard)
export class SnippetsController {
  constructor(private snippetsService: SnippetsService) { }

  @Get()
  async getSnippets(@Param('workspaceId') workspaceId: string) {
    return this.snippetsService.getSnippetsByWorkspace(workspaceId);
  }

  @Get(':snippetId')
  async getSnippet(@Param('snippetId') snippetId: string) {
    return this.snippetsService.getSnippet(snippetId);
  }

  @Post()
  async createSnippet(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: SnippetsCreateDto,
    @CurrentUser() user: User,
  ) {
    const userId = user.id;
    return this.snippetsService.createSnippet(workspaceId, userId, dto);
  }

  @Patch(':snippetId')
  async updateSnippet(
    @Param('snippetId') snippetId: string,
    @Body() dto: SnippetsUpdateDto,
  ) {
    return this.snippetsService.updateSnippet(snippetId, dto);
  }
}
