import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientModule } from 'src/libs/prisma/prisma-client.module';
import { StatesService } from './states.service';

describe('StatesService', () => {
  let service: StatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatesService],
      imports: [PrismaClientModule],
    }).compile();

    service = module.get<StatesService>(StatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
