import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from 'src/common/guards/auth.guard';
import { AiService } from '../services/ai.service';

@Controller('ai')
@UseGuards(SessionAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  ask(
    @Body() body: { question: string },
    @Query('chatId') chatId: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    const question = body.question;
    const filters = workspaceId ? { workspaceId } : undefined;
    return this.aiService.ask(chatId, question, filters);
  }

  @Post('analyze-work-item')
  analyze(@Query('workItemId') workItemId: string) {
    return this.aiService.analyzeWorkItem(workItemId);
  }

  @Post('suggest-snippet-filename')
  suggestSnippetFilename(
    @Query('workspaceId') workspaceId: string,
    @Body() body: { code: string; language?: string },
  ) {
    return this.aiService.suggestSnippetFilename({ ...body, workspaceId });
  }

  @Get('suggest-work-items')
  suggestWorkItems(@Query() query: any) {
    const workspaceId: string | undefined = query.workspaceId;
    return this.aiService.suggestWorkItems(workspaceId);
  }
}
