import { Test, TestingModule } from '@nestjs/testing';
import { PropertyContractsController } from './property-contracts.controller';
import { PropertyContractsService } from './property-contracts.service';

describe('PropertyContractsController', () => {
  let controller: PropertyContractsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyContractsController],
      providers: [PropertyContractsService],
    }).compile();

    controller = module.get<PropertyContractsController>(PropertyContractsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
