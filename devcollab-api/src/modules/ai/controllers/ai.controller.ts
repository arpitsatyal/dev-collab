import { SanitizeIdPipe } from 'src/common/pipes/sanitize-id.pipe';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { AiService } from '../services/ai.service';
import { SuggestSnippetFilenameDto } from '../dto/suggest-snippet-filename.dto';
import { AskDto } from '../dto/ask.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('ask')
  ask(
    @Body() body: AskDto,
    @Query('chatId') chatId: string,
    @Query('workspaceId', SanitizeIdPipe) workspaceId?: string,
  ) {
    const filters = workspaceId ? { workspaceId } : undefined;
    return this.aiService.ask(chatId, body.question, filters);
  }

  @Post('analyze-work-item')
  analyze(@Query('workItemId', SanitizeIdPipe) workItemId: string) {
    return this.aiService.analyzeWorkItem(workItemId);
  }

  @Post('suggest-snippet-filename')
  suggestSnippetFilename(
    @Body() body: SuggestSnippetFilenameDto,
  ) {
    return this.aiService.suggestSnippetFilename(body);
  }

  @Get('suggest-work-items')
  suggestWorkItems(@Query('workspaceId', SanitizeIdPipe) workspaceId?: string) {
    return this.aiService.suggestWorkItems(workspaceId);
  }
}
