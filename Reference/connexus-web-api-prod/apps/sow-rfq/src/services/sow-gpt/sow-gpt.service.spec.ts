import { Test, TestingModule } from '@nestjs/testing';
import { GenerateScopeOfWorkDto } from './dto/generate-sow-gpt.dto';
import { SowGptService } from './sow-gpt.service';

describe('SowGptService', () => {
  let service: SowGptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SowGptService],
    }).compile();

    service = module.get<SowGptService>(SowGptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateScopeOfWorkTemplate', () => {
    it('should generate a scope of work template', async () => {
      const mockDto: GenerateScopeOfWorkDto = {
        serviceId: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
        serviceName: 'Landscaping Service',
        propertyIds: ['1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6'],
        sowName: 'Annual Landscaping Maintenance',
        clientId: '1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6',
      };

      const result = await service.generateScopeOfWorkGpt(mockDto);

      expect(result).toBeDefined();
      expect(result.markdown).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.serviceName).toBe('Test Service');
      expect(result.metadata.propertyCount).toBe(2);
    });
  });
});
