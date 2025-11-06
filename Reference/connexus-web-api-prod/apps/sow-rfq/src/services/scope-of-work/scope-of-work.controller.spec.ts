import { Test, TestingModule } from '@nestjs/testing';
import { ScopeOfWorkController } from './scope-of-work.controller';
import { ScopeOfWorkService } from './scope-of-work.service';

describe('ScopeOfWorkController', () => {
  let controller: ScopeOfWorkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScopeOfWorkController],
      providers: [ScopeOfWorkService],
    }).compile();

    controller = module.get<ScopeOfWorkController>(ScopeOfWorkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getVersionHistory', () => {
    it('should be defined', () => {
      expect(controller.getVersionHistory).toBeDefined();
    });
  });
});
