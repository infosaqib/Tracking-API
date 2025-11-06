import { Test, TestingModule } from '@nestjs/testing';
import { SqsController } from './sqs.controller';
import { SqsService } from './sqs.service';

describe('SqsController', () => {
  let controller: SqsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SqsController],
      providers: [SqsService],
    }).compile();

    controller = module.get<SqsController>(SqsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
