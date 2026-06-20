import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { ChatRepository } from '../repositories/chat.repository';
import { MessageService } from 'src/modules/message/message.service';
import { ChatEngineService } from './ai/chat-engine.service';


describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: ChatRepository, useValue: {} },
        { provide: MessageService, useValue: {} },
        { provide: ChatEngineService, useValue: {} },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
