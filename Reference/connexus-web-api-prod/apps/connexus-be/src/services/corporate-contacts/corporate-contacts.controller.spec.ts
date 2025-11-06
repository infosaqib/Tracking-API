import { Test, TestingModule } from '@nestjs/testing';
import { CorporateContactsController } from './corporate-contacts.controller';
import { CorporateContactsService } from './corporate-contacts.service';

describe('CorporateContactsController', () => {
  let controller: CorporateContactsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorporateContactsController],
      providers: [CorporateContactsService],
    }).compile();

    controller = module.get<CorporateContactsController>(CorporateContactsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
