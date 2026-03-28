import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationController } from './collaboration.controller';
import { CollaborationPort } from './ports/collaboration.port';

describe('CollaborationController', () => {
  let controller: CollaborationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollaborationController],
      providers: [
        {
          provide: CollaborationPort,
          useValue: { authorizeRoom: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<CollaborationController>(CollaborationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
