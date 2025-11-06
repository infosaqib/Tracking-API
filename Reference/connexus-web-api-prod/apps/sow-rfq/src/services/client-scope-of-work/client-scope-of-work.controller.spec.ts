import { Test, TestingModule } from '@nestjs/testing';
import { ClientScopeOfWorkController } from './client-scope-of-work.controller';
import { ClientScopeOfWorkService } from './client-scope-of-work.service';

describe('ClientScopeOfWorkController', () => {
  let controller: ClientScopeOfWorkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientScopeOfWorkController],
      providers: [ClientScopeOfWorkService],
    }).compile();

    controller = module.get<ClientScopeOfWorkController>(ClientScopeOfWorkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
