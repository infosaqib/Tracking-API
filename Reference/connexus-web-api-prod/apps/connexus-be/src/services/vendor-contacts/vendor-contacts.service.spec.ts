import { Test, TestingModule } from '@nestjs/testing';
import { VendorContactsService } from './vendor-contacts.service';

describe('VendorContactsService', () => {
  let service: VendorContactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorContactsService],
    }).compile();

    service = module.get<VendorContactsService>(VendorContactsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
