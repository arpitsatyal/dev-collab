import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { ConfigService } from '@nestjs/config';
import { QueueProviderPort } from './ports/queue-provider.port';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === 'QUEUE_URL') return 'mock-default-queue-url';
              if (key === 'MISSION_QUEUE_URL') return 'mock-mission-queue-url';
              return null;
            }),
          },
        },
        {
          provide: QueueProviderPort,
          useValue: {
            sendRawMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
