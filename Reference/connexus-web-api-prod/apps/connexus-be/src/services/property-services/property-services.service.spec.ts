import { Test, TestingModule } from '@nestjs/testing';
import { PropertyServicesService } from './property-services.service';

describe('PropertyServicesService', () => {
  let service: PropertyServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyServicesService],
    }).compile();

    service = module.get<PropertyServicesService>(PropertyServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
