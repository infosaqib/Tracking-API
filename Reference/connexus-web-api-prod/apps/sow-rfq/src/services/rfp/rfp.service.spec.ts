import { Test, TestingModule } from '@nestjs/testing';
import { RfpService } from './rfp.service';

describe('RfpService', () => {
  let service: RfpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RfpService],
    }).compile();

    service = module.get<RfpService>(RfpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
