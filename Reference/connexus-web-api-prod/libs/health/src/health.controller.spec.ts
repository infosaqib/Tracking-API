import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<HealthService>;

  beforeEach(async () => {
    const mockHealthService = {
      performHealthChecks: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('readiness', () => {
    it('should call healthService.performHealthChecks', async () => {
      const mockResult = {
        status: 'ok' as const,
        info: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          storage: { status: 'up' },
        },
        details: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          storage: { status: 'up' },
        },
      };

      healthService.performHealthChecks.mockResolvedValue(mockResult);

      const result = await controller.readiness();

      expect(healthService.performHealthChecks).toHaveBeenCalled();
      expect(result).toBe(mockResult);
    });

    it('should handle health check errors', async () => {
      const mockErrorResult = {
        status: 'error' as const,
        error: {
          database: { status: 'down', message: 'Connection timeout' },
        },
        details: {
          database: { status: 'down', message: 'Connection timeout' },
          memory_heap: { status: 'up' },
          storage: { status: 'up' },
        },
      };

      healthService.performHealthChecks.mockResolvedValue(mockErrorResult);

      const result = await controller.readiness();

      expect(healthService.performHealthChecks).toHaveBeenCalled();
      expect(result).toBe(mockErrorResult);
      expect(result.status).toBe('error');
    });
  });
});
