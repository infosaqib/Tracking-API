import { Test, TestingModule } from '@nestjs/testing';
import { PropertyServicesController } from './property-services.controller';
import { PropertyServicesService } from './property-services.service';

describe('PropertyServicesController', () => {
  let controller: PropertyServicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyServicesController],
      providers: [PropertyServicesService],
    }).compile();

    controller = module.get<PropertyServicesController>(PropertyServicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
