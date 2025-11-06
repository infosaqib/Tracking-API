import { Test, TestingModule } from '@nestjs/testing';
import { TemplateGenerationTasksService } from './template-generation-tasks.service';

describe('TemplateGenerationTasksService', () => {
  let service: TemplateGenerationTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateGenerationTasksService],
    }).compile();

    service = module.get<TemplateGenerationTasksService>(TemplateGenerationTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
