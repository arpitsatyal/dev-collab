import { Test, TestingModule } from '@nestjs/testing';
import { ChatEngineService } from './chat-engine.service';
import { PromptPort } from '../ports/prompt.port';
import { RetrievalPort } from '../ports/retrieval.port';
import { GenerationPort } from '../ports/generation.port';
import { LlmGateway } from '../ports/llm.port';
import { MessageService } from 'src/modules/message/message.service';
import { AgentPort } from '../ports/agent.port';
import { AiConfig } from '../ai.config';

describe('ChatEngineService', () => {
  let service: ChatEngineService;
  
  const mockPromptPort = {
    buildChatMessages: jest.fn(),
    constructPrompt: jest.fn(),
    buildIntentClassificationPrompt: jest.fn(),
    buildConversationalMessages: jest.fn(),
  };

  const mockRetrievalPort = {
    generateQueryVariations: jest.fn(),
    performHybridSearch: jest.fn(),
  };

  const mockGenerationPort = {
    generateAnswer: jest.fn(),
  };

  const mockLlmGateway = {
    getReasoningLLM: jest.fn(),
    getSpeedyLLM: jest.fn(),
    getReasoningStructuredLLM: jest.fn(),
  };

  const mockMessageService = {
    getHistory: jest.fn(),
  };

  const mockAgentPort = {
    runAgentGraph: jest.fn(),
  };

  const mockAiConfig = {
    appScopeReply: 'I can assist with Dev-Collab only.',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatEngineService,
        { provide: PromptPort, useValue: mockPromptPort },
        { provide: RetrievalPort, useValue: mockRetrievalPort },
        { provide: GenerationPort, useValue: mockGenerationPort },
        { provide: LlmGateway, useValue: mockLlmGateway },
        { provide: MessageService, useValue: mockMessageService },
        { provide: AgentPort, useValue: mockAgentPort },
        { provide: AiConfig, useValue: mockAiConfig },
      ],
    }).compile();

    service = module.get<ChatEngineService>(ChatEngineService);

    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    mockMessageService.getHistory.mockResolvedValue([]);
    
    // Mock classifier LLM returning default intent
    mockLlmGateway.getReasoningStructuredLLM.mockResolvedValue({
      invoke: jest.fn().mockResolvedValue({ intent: 'WORKSPACE_QUERY', scope: 'APP_SPECIFIC', confidence: 0.9 })
    });
  });

  describe('AI Response Routing', () => {
    it('should route to Conversational logic when intent is CONVERSATIONAL', async () => {
      // Setup classifier to return CONVERSATIONAL
      mockLlmGateway.getReasoningStructuredLLM.mockResolvedValue({
        invoke: jest.fn().mockResolvedValue({ intent: 'CONVERSATIONAL', scope: 'APP_SPECIFIC', confidence: 0.9 })
      });
      
      const mockPipe = jest.fn().mockReturnValue({ invoke: jest.fn().mockResolvedValue('Hello there!') });
      mockLlmGateway.getSpeedyLLM.mockResolvedValue({ pipe: mockPipe });

      const result = await service.getAIResponse('chat-1', 'Hi!');

      expect(result.answer).toBe('Hello there!');
      expect(mockLlmGateway.getSpeedyLLM).toHaveBeenCalled();
    });

    it('should return appScopeReply when intent is OUT_OF_SCOPE and no workspaceId is provided', async () => {
      mockLlmGateway.getReasoningStructuredLLM.mockResolvedValue({
        invoke: jest.fn().mockResolvedValue({ intent: 'WORKSPACE_QUERY', scope: 'OUT_OF_SCOPE', confidence: 0.9 })
      });

      const result = await service.getAIResponse('chat-1', 'How do I cook pasta?');

      expect(result.answer).toBe(mockAiConfig.appScopeReply);
      expect(mockAgentPort.runAgentGraph).not.toHaveBeenCalled();
    });

    it('should route to LangGraph Agent when workspaceId is provided', async () => {
      mockLlmGateway.getReasoningStructuredLLM.mockResolvedValue({
        invoke: jest.fn().mockResolvedValue({ intent: 'WORKSPACE_QUERY', scope: 'APP_SPECIFIC', confidence: 0.9 })
      });
      
      mockAgentPort.runAgentGraph.mockResolvedValue({
        answer: 'Here are your workspace details.',
        calledTools: ['getSnippetsTool']
      });

      const result = await service.getAIResponse('chat-1', 'What are the tasks?', { workspaceId: 'ws-1' });

      expect(result.answer).toBe('Here are your workspace details.');
      expect(mockAgentPort.runAgentGraph).toHaveBeenCalledWith(undefined, 'ws-1');
    });

    it('should route to Global Search when no workspaceId is provided but query is APP_SPECIFIC', async () => {
      mockLlmGateway.getReasoningStructuredLLM.mockResolvedValue({
        invoke: jest.fn().mockResolvedValue({ intent: 'WORKSPACE_QUERY', scope: 'APP_SPECIFIC', confidence: 0.9 })
      });
      
      mockRetrievalPort.performHybridSearch.mockResolvedValue([
        { doc: { pageContent: 'Global doc content', metadata: {} }, score: 0.9 }
      ]);
      
      mockGenerationPort.generateAnswer.mockResolvedValue({
        answer: 'Generated global answer.',
        context: 'Global doc content'
      });

      const result = await service.getAIResponse('chat-1', 'Search globally');

      expect(result.answer).toBe('Generated global answer.');
      expect(mockRetrievalPort.performHybridSearch).toHaveBeenCalled();
      expect(mockGenerationPort.generateAnswer).toHaveBeenCalled();
    });
  });
});
