import { Test, TestingModule } from '@nestjs/testing';
import { OnlyOfficeController } from './only-office.controller';
import { OnlyOfficeService } from './only-office.service';

describe('OnlyOfficeController', () => {
  let controller: OnlyOfficeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnlyOfficeController],
      providers: [OnlyOfficeService],
    }).compile();

    controller = module.get<OnlyOfficeController>(OnlyOfficeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
