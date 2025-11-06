import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientModule } from 'src/libs/prisma/prisma-client.module';
import { StatesController } from './states.controller';
import { StatesService } from './states.service';

describe('StatesController', () => {
  let controller: StatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatesController],
      providers: [StatesService],
      imports: [PrismaClientModule],
    }).compile();

    controller = module.get<StatesController>(StatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
