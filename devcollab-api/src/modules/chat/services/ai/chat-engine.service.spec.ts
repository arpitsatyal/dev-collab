import { Test, TestingModule } from '@nestjs/testing';
import { ChatEngineService } from './chat-engine.service';
import { ChatContextService } from './chat-context.service';
import { ChatIntentService } from './chat-intent.service';
import { ChatConversationalHandler } from 'src/modules/chat/handlers/conversational.handler';
import { ChatWorkspaceQueryHandler } from 'src/modules/chat/handlers/workspace-query.handler';

describe('ChatEngineService', () => {
  let service: ChatEngineService;

  const mockChatContextService = {
    getFormattedHistory: jest.fn(),
    createChatContext: jest.fn(),
  };

  const mockChatIntentService = {
    classifyIntent: jest.fn(),
  };

  const mockChatConversationalHandler = {
    handle: jest.fn(),
  };

  const mockChatWorkspaceQueryHandler = {
    handle: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatEngineService,
        { provide: ChatContextService, useValue: mockChatContextService },
        { provide: ChatIntentService, useValue: mockChatIntentService },
        { provide: ChatConversationalHandler, useValue: mockChatConversationalHandler },
        { provide: ChatWorkspaceQueryHandler, useValue: mockChatWorkspaceQueryHandler },
      ],
    }).compile();

    service = module.get<ChatEngineService>(ChatEngineService);
    jest.clearAllMocks();
  });

  describe('getAIResponse', () => {
    const mockContext = {
      chatId: 'chat-1',
      question: 'Hello',
      history: 'some history',
      filters: {},
    };

    beforeEach(() => {
      mockChatContextService.getFormattedHistory.mockResolvedValue('some history');
      mockChatContextService.createChatContext.mockReturnValue(mockContext);
    });

    it('should delegate to ChatConversationalHandler when intent is CONVERSATIONAL', async () => {
      mockChatIntentService.classifyIntent.mockResolvedValue({
        intent: 'CONVERSATIONAL',
        scope: 'APP_SPECIFIC',
      });
      mockChatConversationalHandler.handle.mockResolvedValue({ answer: 'Hello back' });

      const result = await service.getAIResponse({
        chatId: 'chat-1',
        question: 'Hello',
        filters: {},
      });

      expect(mockChatContextService.getFormattedHistory).toHaveBeenCalledWith('chat-1', 10);
      expect(mockChatContextService.createChatContext).toHaveBeenCalledWith('chat-1', 'Hello', 'some history', {});
      expect(mockChatIntentService.classifyIntent).toHaveBeenCalledWith(mockContext);
      expect(mockChatConversationalHandler.handle).toHaveBeenCalledWith(mockContext, 'APP_SPECIFIC');
      expect(result).toEqual({ answer: 'Hello back' });
    });

    it('should delegate to ChatWorkspaceQueryHandler when intent is not CONVERSATIONAL', async () => {
      mockChatIntentService.classifyIntent.mockResolvedValue({
        intent: 'WORKSPACE_QUERY',
        scope: 'APP_SPECIFIC',
      });
      mockChatWorkspaceQueryHandler.handle.mockResolvedValue({ answer: 'Here is info' });

      const result = await service.getAIResponse({
        chatId: 'chat-1',
        question: 'What is this workspace?',
        filters: {},
      });

      expect(mockChatIntentService.classifyIntent).toHaveBeenCalledWith(mockContext);
      expect(mockChatWorkspaceQueryHandler.handle).toHaveBeenCalledWith(mockContext);
      expect(result).toEqual({ answer: 'Here is info' });
    });
  });
});
