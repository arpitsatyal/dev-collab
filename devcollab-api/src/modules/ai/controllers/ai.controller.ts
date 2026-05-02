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

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('analyze-work-item')
  analyze(@Query('workItemId', SanitizeIdPipe) workItemId: string) {
    if (!workItemId) throw new BadRequestException('Work item ID is required');
    return this.aiService.analyzeWorkItem({ workItemId });
  }

  @Post('suggest-snippet-filename')
  suggestSnippetFilename(@Body() body: SuggestSnippetFilenameDto) {
    return this.aiService.suggestSnippetFilename({
      workspaceId: body.workspaceId,
      code: body.code,
      language: body.language,
    });
  }

  @Get('suggest-work-items')
  suggestWorkItems(@Query('workspaceId', SanitizeIdPipe) workspaceId?: string) {
    if (!workspaceId) throw new BadRequestException('Workspace ID is required');
    return this.aiService.suggestWorkItems({ workspaceId });
  }
}
