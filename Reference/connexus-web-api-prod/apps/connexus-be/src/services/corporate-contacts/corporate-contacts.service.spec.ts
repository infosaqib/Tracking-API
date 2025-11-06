import { Test, TestingModule } from '@nestjs/testing';
import { CorporateContactsService } from './corporate-contacts.service';

describe('CorporateContactsService', () => {
  let service: CorporateContactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorporateContactsService],
    }).compile();

    service = module.get<CorporateContactsService>(CorporateContactsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
