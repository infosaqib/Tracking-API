import { Test, TestingModule } from '@nestjs/testing';
import { BackgroundJobsController } from './background-jobs.controller';
import { BackgroundJobsService } from './background-jobs.service';

describe('BackgroundJobsController', () => {
  let controller: BackgroundJobsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackgroundJobsController],
      providers: [BackgroundJobsService],
    }).compile();

    controller = module.get<BackgroundJobsController>(BackgroundJobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
