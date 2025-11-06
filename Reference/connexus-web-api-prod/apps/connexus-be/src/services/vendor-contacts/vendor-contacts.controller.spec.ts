import { Test, TestingModule } from '@nestjs/testing';
import { VendorContactsController } from './vendor-contacts.controller';
import { VendorContactsService } from './vendor-contacts.service';

describe('VendorContactsController', () => {
  let controller: VendorContactsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorContactsController],
      providers: [VendorContactsService],
    }).compile();

    controller = module.get<VendorContactsController>(VendorContactsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
