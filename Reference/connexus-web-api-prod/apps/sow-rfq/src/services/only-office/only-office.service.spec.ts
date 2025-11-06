import { Test, TestingModule } from '@nestjs/testing';
import { OnlyOfficeService } from './only-office.service';

describe('OnlyOfficeService', () => {
  let service: OnlyOfficeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnlyOfficeService],
    }).compile();

    service = module.get<OnlyOfficeService>(OnlyOfficeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
