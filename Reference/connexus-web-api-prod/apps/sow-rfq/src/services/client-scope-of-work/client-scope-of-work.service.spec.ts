import { Test, TestingModule } from '@nestjs/testing';
import { ClientScopeOfWorkService } from './client-scope-of-work.service';

describe('ClientScopeOfWorkService', () => {
  let service: ClientScopeOfWorkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientScopeOfWorkService],
    }).compile();

    service = module.get<ClientScopeOfWorkService>(ClientScopeOfWorkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
