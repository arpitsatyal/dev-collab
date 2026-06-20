import { Injectable } from '@nestjs/common';
import { SuggestionService } from './suggestion.service';
import { WorkItemsService } from 'src/modules/work-items/work-items.service';
import {
  AnalyzeWorkItemRequest,
  SuggestSnippetFilenameRequest,
  SuggestWorkItemsRequest,
} from '../types/ai.types';

@Injectable()
export class AiService {
  constructor(
    private readonly suggestionService: SuggestionService,
    private readonly workItemsService: WorkItemsService,
  ) { }

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
