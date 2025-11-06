import { Test, TestingModule } from '@nestjs/testing';
import { PropertyContractServicesService } from './property-contract-services.service';

describe('PropertyContractServicesService', () => {
  let service: PropertyContractServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyContractServicesService],
    }).compile();

    service = module.get<PropertyContractServicesService>(PropertyContractServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
