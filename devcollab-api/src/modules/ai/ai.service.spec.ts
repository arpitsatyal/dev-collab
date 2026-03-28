import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './services/ai.service';
import { MessageService } from '../message/message.service';
import { WorkItemsService } from '../work-items/work-items.service';
import { SuggestionService } from './services/suggestion.service';
import { ChatEngineService } from './services/chat-engine.service';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ChatEngineService,
          useValue: {
            getAIResponse: jest.fn().mockResolvedValue({ answer: 'ok' }),
          },
        },
        {
          provide: SuggestionService,
          useValue: {
            generateImplementationPlan: jest.fn(),
            suggestSnippetFilenameForCode: jest.fn(),
            suggestWorkItems: jest.fn(),
          },
        },
        {
          provide: MessageService,
          useValue: { saveUserMessage: jest.fn(), saveAiMessage: jest.fn() },
        },
        { provide: WorkItemsService, useValue: { update: jest.fn() } },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
