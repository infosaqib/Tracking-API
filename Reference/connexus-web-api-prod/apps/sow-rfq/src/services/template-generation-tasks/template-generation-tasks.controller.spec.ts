import { Test, TestingModule } from '@nestjs/testing';
import { TemplateGenerationTasksController } from './template-generation-tasks.controller';
import { TemplateGenerationTasksService } from './template-generation-tasks.service';

describe('TemplateGenerationTasksController', () => {
  let controller: TemplateGenerationTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateGenerationTasksController],
      providers: [TemplateGenerationTasksService],
    }).compile();

    controller = module.get<TemplateGenerationTasksController>(TemplateGenerationTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
