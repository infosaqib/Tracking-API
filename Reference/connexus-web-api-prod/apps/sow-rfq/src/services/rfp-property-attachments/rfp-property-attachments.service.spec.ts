import { Test, TestingModule } from '@nestjs/testing';
import { RfpPropertyAttachmentsService } from './rfp-property-attachments.service';

describe('RfpPropertyAttachmentsService', () => {
  let service: RfpPropertyAttachmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RfpPropertyAttachmentsService],
    }).compile();

    service = module.get<RfpPropertyAttachmentsService>(RfpPropertyAttachmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
