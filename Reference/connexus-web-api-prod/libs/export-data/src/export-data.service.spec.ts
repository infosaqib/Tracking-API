import { Test, TestingModule } from '@nestjs/testing';
import { ExportDataService } from './export-data.service';

describe('ExportDataService', () => {
  let service: ExportDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportDataService],
    }).compile();

    service = module.get<ExportDataService>(ExportDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
