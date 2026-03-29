import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from 'src/common/guards/auth.guard';
import { AiService } from '../services/ai.service';
import { AskBodyDto } from '../dto/ask-body.dto';
import { SuggestSnippetFilenameDto } from '../dto/suggest-snippet-filename.dto';

@Controller('ai')
@UseGuards(SessionAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('ask')
  ask(
    @Body() body: AskBodyDto,
    @Query('chatId') chatId: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    const filters = workspaceId ? { workspaceId } : undefined;
    return this.aiService.ask(chatId, body.question, filters);
  }

  @Post('analyze-work-item')
  analyze(@Query('workItemId') workItemId: string) {
    return this.aiService.analyzeWorkItem(workItemId);
  }

  @Post('suggest-snippet-filename')
  suggestSnippetFilename(
    @Body() body: SuggestSnippetFilenameDto,
  ) {
    return this.aiService.suggestSnippetFilename(body);
  }

  @Get('suggest-work-items')
  suggestWorkItems(@Query() query: any) {
    const workspaceId: string | undefined = query.workspaceId;
    return this.aiService.suggestWorkItems(workspaceId);
  }
}
