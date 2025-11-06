import { Test, TestingModule } from '@nestjs/testing';
import { SowGptController } from './sow-gpt.controller';
import { SowGptService } from './sow-gpt.service';

describe('SowGptController', () => {
  let controller: SowGptController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SowGptController],
      providers: [SowGptService],
    }).compile();

    controller = module.get<SowGptController>(SowGptController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateScopeOfWorkGpt', () => {
    it('should be defined', () => {
      expect(controller.create).toBeDefined();
    });
  });
});
