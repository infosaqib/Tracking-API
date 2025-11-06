import { Test, TestingModule } from '@nestjs/testing';
import { RfpPropertyAttachmentsController } from './rfp-property-attachments.controller';
import { RfpPropertyAttachmentsService } from './rfp-property-attachments.service';

describe('RfpPropertyAttachmentsController', () => {
  let controller: RfpPropertyAttachmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RfpPropertyAttachmentsController],
      providers: [RfpPropertyAttachmentsService],
    }).compile();

    controller = module.get<RfpPropertyAttachmentsController>(RfpPropertyAttachmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
