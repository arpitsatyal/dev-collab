import { SanitizeIdPipe } from 'src/common/pipes/sanitize-id.pipe';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';

import { AiService } from '../services/ai.service';
import { SuggestSnippetFilenameDto } from '../dto/suggest-snippet-filename.dto';
import { AskDto } from '../dto/ask.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  ask(
    @Body() body: AskDto,
    @Query('workspaceId', SanitizeIdPipe) workspaceId?: string,
  ) {
    const filters = workspaceId ? { workspaceId } : undefined;
    return this.aiService.ask(body.chatId, body.question, filters);
  }

  @Post('analyze-work-item')
  analyze(@Query('workItemId', SanitizeIdPipe) workItemId: string) {
    if (!workItemId) throw new BadRequestException('Work item ID is required');
    return this.aiService.analyzeWorkItem(workItemId);
  }

  @Post('suggest-snippet-filename')
  suggestSnippetFilename(@Body() body: SuggestSnippetFilenameDto) {
    return this.aiService.suggestSnippetFilename(body);
  }

  @Get('suggest-work-items')
  suggestWorkItems(@Query('workspaceId', SanitizeIdPipe) workspaceId?: string) {
    if (!workspaceId) throw new BadRequestException('Workspace ID is required');
    return this.aiService.suggestWorkItems(workspaceId);
  }
}
