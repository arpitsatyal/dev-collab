import { Injectable } from '@nestjs/common';
import { ChatEngineService } from './chat-engine.service';
import { SuggestionService } from './suggestion.service';
import { MessageService } from 'src/modules/message/message.service';
import { WorkItemsService } from 'src/modules/work-items/work-items.service';
import {
  AnalyzeWorkItemRequest,
  GetAiResponseRequest,
  SuggestSnippetFilenameRequest,
  SuggestWorkItemsRequest,
} from '../interfaces/ai.interfaces';

@Injectable()
export class AiService {
  constructor(
    private readonly chatEngineService: ChatEngineService,
    private readonly suggestionService: SuggestionService,
    private readonly messageService: MessageService,
    private readonly workItemsService: WorkItemsService,
  ) {}

  async ask(request: GetAiResponseRequest) {
    const { chatId, question, filters } = request;
    await this.messageService.saveUserMessage(chatId, question);

    const { answer } = await this.chatEngineService.getAIResponse({
      chatId,
      question,
      filters,
    });

    await this.messageService.saveAiMessage(chatId, answer);

    return { answer };
  }

  async analyzeWorkItem(request: AnalyzeWorkItemRequest) {
    const { workItemId } = request;
    const plan = await this.suggestionService.generateImplementationPlan({
      workItemId,
    });

    await this.workItemsService.update(workItemId, {
      aiPlan: JSON.stringify(plan),
    });

    return { plan };
  }

  async suggestSnippetFilename(request: SuggestSnippetFilenameRequest) {
    const fileName =
      await this.suggestionService.suggestSnippetFilenameForCode(request);
    return { fileName };
  }

  async suggestWorkItems(request: SuggestWorkItemsRequest) {
    const { workspaceId } = request;
    const suggestions = await this.suggestionService.suggestWorkItems({
      workspaceId,
    });

    return { suggestions };
  }
}
