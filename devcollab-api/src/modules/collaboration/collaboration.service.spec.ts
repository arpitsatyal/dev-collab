import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationService } from './collaboration.service';
import { CollaborationPort } from './ports/collaboration.port';

describe('CollaborationService', () => {
  let service: CollaborationService;

  beforeEach(async () => {
    process.env.LIVEBLOCKS_SECRET_KEY = 'sk_test_mock_key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationService,
        {
          provide: CollaborationPort,
          useValue: {
            authorizeRoom: jest.fn(),
            getYdocContent: jest.fn(),
            getComment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CollaborationService>(CollaborationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
