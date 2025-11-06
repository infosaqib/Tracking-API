import { Test, TestingModule } from '@nestjs/testing';
import { PropertyContractServicesController } from './property-contract-services.controller';
import { PropertyContractServicesService } from './property-contract-services.service';

describe('PropertyContractServicesController', () => {
  let controller: PropertyContractServicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyContractServicesController],
      providers: [PropertyContractServicesService],
    }).compile();

    controller = module.get<PropertyContractServicesController>(PropertyContractServicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
