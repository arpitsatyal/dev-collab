import { Injectable } from '@nestjs/common';
import { ChatEngineService } from './chat-engine.service';
import { SuggestionService } from './suggestion.service';
import { MessageService } from 'src/modules/message/message.service';
import { WorkItemsService } from 'src/modules/work-items/work-items.service';
import { SuggestSnippetFilenameDto } from '../dto/suggest-snippet-filename.dto';
import { AiFilters } from '../interfaces';

@Injectable()
export class AiService {
  constructor(
    private readonly chatEngineService: ChatEngineService,
    private readonly suggestionService: SuggestionService,
    private readonly messageService: MessageService,
    private readonly workItemsService: WorkItemsService,
  ) { }

  async ask(chatId: string, question: string, filters?: AiFilters) {
    await this.messageService.saveUserMessage(chatId, question);

    const { answer } = await this.chatEngineService.getAIResponse(
      chatId,
      question,
      filters,
    );

    await this.messageService.saveAiMessage(chatId, answer);

    return { answer };
  }

  async analyzeWorkItem(workItemId: string) {
    const plan = await this.suggestionService.generateImplementationPlan(
      workItemId,
    );

    await this.workItemsService.update(workItemId, {
      aiPlan: JSON.stringify(plan),
    });

    return { plan };
  }

  async suggestSnippetFilename(params: SuggestSnippetFilenameDto) {
    const fileName =
      await this.suggestionService.suggestSnippetFilenameForCode(params);
    return { fileName };
  }

  async suggestWorkItems(workspaceId: string) {
    const suggestions = await this.suggestionService.suggestWorkItems(
      workspaceId,
    );

    return { suggestions };
  }
}
