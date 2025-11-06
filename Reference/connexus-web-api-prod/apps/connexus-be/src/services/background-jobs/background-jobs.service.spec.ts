import { Test, TestingModule } from '@nestjs/testing';
import { BackgroundJobsService } from './background-jobs.service';

describe('BackgroundJobsService', () => {
  let service: BackgroundJobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BackgroundJobsService],
    }).compile();

    service = module.get<BackgroundJobsService>(BackgroundJobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
