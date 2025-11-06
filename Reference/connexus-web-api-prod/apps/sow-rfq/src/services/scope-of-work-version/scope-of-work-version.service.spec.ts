import { Test, TestingModule } from '@nestjs/testing';
import { ScopeOfWorkVersionService } from './scope-of-work-version.service';

describe('ScopeOfWorkVersionService', () => {
  let service: ScopeOfWorkVersionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScopeOfWorkVersionService],
    }).compile();

    service = module.get<ScopeOfWorkVersionService>(ScopeOfWorkVersionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
