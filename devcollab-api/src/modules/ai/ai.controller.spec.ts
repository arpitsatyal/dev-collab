import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './controllers/ai.controller';
import { AiService } from './services/ai.service';
import { MessageService } from '../message/message.service';
import { WorkItemsService } from '../work-items/work-items.service';
import { ChatEngineService } from './services/chat-engine.service';
import { SuggestionService } from './services/suggestion.service';

describe('AiController', () => {
  let controller: AiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
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

    controller = module.get<AiController>(AiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
