import { Test, TestingModule } from '@nestjs/testing';
import { PropertyContactsService } from './property-contacts.service';

describe('PropertyContactsService', () => {
  let service: PropertyContactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyContactsService],
    }).compile();

    service = module.get<PropertyContactsService>(PropertyContactsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
