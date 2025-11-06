import { Test, TestingModule } from '@nestjs/testing';
import { SesService } from './ses.service';

describe('SesService', () => {
  let service: SesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SesService],
    }).compile();

    service = module.get<SesService>(SesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send email', async () => {
    const response = await service.sendCustomVerificationEmail({
      verificationLink: 'https://example.com',
      email: 'raoof@neoito.com',
    });

    expect(response).toBeDefined();
  });
});
