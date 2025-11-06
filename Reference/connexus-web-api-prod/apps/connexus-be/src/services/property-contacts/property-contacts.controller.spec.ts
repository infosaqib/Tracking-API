import { Test, TestingModule } from '@nestjs/testing';
import { PropertyContactsController } from './property-contacts.controller';
import { PropertyContactsService } from './property-contacts.service';

describe('PropertyContactsController', () => {
  let controller: PropertyContactsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyContactsController],
      providers: [PropertyContactsService],
    }).compile();

    controller = module.get<PropertyContactsController>(PropertyContactsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
