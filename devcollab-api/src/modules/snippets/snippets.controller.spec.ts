import { Test, TestingModule } from '@nestjs/testing';
import { SnippetsController } from './snippets.controller';
import { SnippetsService } from './snippets.service';

describe('SnippetsController', () => {
  let controller: SnippetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SnippetsController],
      providers: [{ provide: SnippetsService, useValue: {} }],
    }).compile();

    controller = module.get<SnippetsController>(SnippetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
