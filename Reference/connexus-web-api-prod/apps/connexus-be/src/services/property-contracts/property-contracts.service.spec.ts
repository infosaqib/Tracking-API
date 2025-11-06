import { Test, TestingModule } from '@nestjs/testing';
import { PropertyContractsService } from './property-contracts.service';

describe('PropertyContractsService', () => {
  let service: PropertyContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyContractsService],
    }).compile();

    service = module.get<PropertyContractsService>(PropertyContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
