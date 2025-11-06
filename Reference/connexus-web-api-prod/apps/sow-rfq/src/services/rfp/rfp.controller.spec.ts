import { Test, TestingModule } from '@nestjs/testing';
import { RfpController } from './rfp.controller';
import { RfpService } from './rfp.service';

describe('RfpController', () => {
  let controller: RfpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RfpController],
      providers: [RfpService],
    }).compile();

    controller = module.get<RfpController>(RfpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
