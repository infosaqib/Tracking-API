import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientModule } from 'src/libs/prisma/prisma-client.module';
import { CountriesService } from './countries.service';

describe('CountriesService', () => {
  let service: CountriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CountriesService],
      imports: [PrismaClientModule],
    }).compile();

    service = module.get<CountriesService>(CountriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
