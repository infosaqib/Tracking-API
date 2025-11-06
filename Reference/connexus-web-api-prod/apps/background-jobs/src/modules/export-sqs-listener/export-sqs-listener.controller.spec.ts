import { Test, TestingModule } from '@nestjs/testing';
import { ExportSqsListenerController } from './export-sqs-listener.controller';
import { ExportSqsListenerService } from './export-sqs-listener.service';

describe('ExportSqsListenerController', () => {
  let controller: ExportSqsListenerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportSqsListenerController],
      providers: [ExportSqsListenerService],
    }).compile();

    controller = module.get<ExportSqsListenerController>(ExportSqsListenerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
