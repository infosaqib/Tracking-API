import { Test, TestingModule } from '@nestjs/testing';
import { CountiesController } from './counties.controller';
import { CountiesService } from './counties.service';

describe('CountiesController', () => {
  let controller: CountiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CountiesController],
      providers: [CountiesService],
    }).compile();

    controller = module.get<CountiesController>(CountiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
