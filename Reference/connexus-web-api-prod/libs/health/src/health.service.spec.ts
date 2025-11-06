import { PrismaService as PrismaClientService } from '@app/prisma';
import {
  DiskHealthIndicator,
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import {
  DEFAULT_HEALTH_CONFIG,
  HEALTH_CONFIG,
} from './interfaces/health-config.interface';

describe('HealthService', () => {
  let service: HealthService;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let diskHealthIndicator: jest.Mocked<DiskHealthIndicator>;
  let prismaHealthIndicator: jest.Mocked<PrismaHealthIndicator>;
  let memoryHealthIndicator: jest.Mocked<MemoryHealthIndicator>;
  let prismaClientService: jest.Mocked<PrismaClientService>;

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn(),
    };

    const mockDiskHealthIndicator = {
      checkStorage: jest.fn(),
    };

    const mockPrismaHealthIndicator = {
      pingCheck: jest.fn(),
    };

    const mockMemoryHealthIndicator = {
      checkHeap: jest.fn(),
    };

    const mockPrismaClientService = {
      client: {},
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: DiskHealthIndicator,
          useValue: mockDiskHealthIndicator,
        },
        {
          provide: PrismaHealthIndicator,
          useValue: mockPrismaHealthIndicator,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealthIndicator,
        },
        {
          provide: PrismaClientService,
          useValue: mockPrismaClientService,
        },
        {
          provide: HEALTH_CONFIG,
          useValue: DEFAULT_HEALTH_CONFIG,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    healthCheckService = module.get(HealthCheckService);
    diskHealthIndicator = module.get(DiskHealthIndicator);
    prismaHealthIndicator = module.get(PrismaHealthIndicator);
    memoryHealthIndicator = module.get(MemoryHealthIndicator);
    prismaClientService = module.get(PrismaClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('performHealthChecks', () => {
    it('should call health.check with all enabled checks', async () => {
      const mockResult = { status: 'ok', info: {}, details: {} };
      healthCheckService.check.mockResolvedValue(mockResult as any);

      const result = await service.performHealthChecks();

      expect(healthCheckService.check).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
        ]),
      );
      expect(result).toBe(mockResult);
    });

    it('should only include enabled checks', async () => {
      const customConfig = { enabledChecks: ['database'] as const };
      const customService = new HealthService(
        healthCheckService,
        diskHealthIndicator,
        prismaHealthIndicator,
        memoryHealthIndicator,
        prismaClientService,
        customConfig,
      );

      const mockResult = { status: 'ok', info: {}, details: {} };
      healthCheckService.check.mockResolvedValue(mockResult as any);

      await customService.performHealthChecks();

      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
    });
  });

  describe('checkDatabase', () => {
    it('should call prisma health indicator with correct parameters', async () => {
      const mockResult = { database: { status: 'up' } };
      prismaHealthIndicator.pingCheck.mockResolvedValue(mockResult);

      const result = await service.checkDatabase();

      expect(prismaHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'database',
        prismaClientService.client,
        { timeout: 10000 },
      );
      expect(result).toBe(mockResult);
    });

    it('should use custom database configuration', async () => {
      const customConfig = {
        database: { timeout: 5000, key: 'custom_db' },
      };
      const customService = new HealthService(
        healthCheckService,
        diskHealthIndicator,
        prismaHealthIndicator,
        memoryHealthIndicator,
        prismaClientService,
        customConfig,
      );

      const mockResult = { custom_db: { status: 'up' } };
      prismaHealthIndicator.pingCheck.mockResolvedValue(mockResult);

      await customService.checkDatabase();

      expect(prismaHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'custom_db',
        prismaClientService.client,
        { timeout: 5000 },
      );
    });
  });

  describe('checkMemory', () => {
    it('should call memory health indicator with correct parameters', async () => {
      const mockResult = { memory_heap: { status: 'up' } };
      memoryHealthIndicator.checkHeap.mockResolvedValue(mockResult);

      const result = await service.checkMemory();

      expect(memoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
        'memory_heap',
        150 * 1024 * 1024,
      );
      expect(result).toBe(mockResult);
    });

    it('should use custom memory configuration', async () => {
      const customConfig = {
        memory: { heapThreshold: 200 * 1024 * 1024, key: 'custom_memory' },
      };
      const customService = new HealthService(
        healthCheckService,
        diskHealthIndicator,
        prismaHealthIndicator,
        memoryHealthIndicator,
        prismaClientService,
        customConfig,
      );

      const mockResult = { custom_memory: { status: 'up' } };
      memoryHealthIndicator.checkHeap.mockResolvedValue(mockResult);

      await customService.checkMemory();

      expect(memoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
        'custom_memory',
        200 * 1024 * 1024,
      );
    });
  });

  describe('checkDisk', () => {
    it('should call disk health indicator with correct parameters', async () => {
      const mockResult = { storage: { status: 'up' } };
      diskHealthIndicator.checkStorage.mockResolvedValue(mockResult);

      const result = await service.checkDisk();

      expect(diskHealthIndicator.checkStorage).toHaveBeenCalledWith('storage', {
        thresholdPercent: 0.8,
        path: '/',
      });
      expect(result).toBe(mockResult);
    });

    it('should use custom disk configuration', async () => {
      const customConfig = {
        disk: { thresholdPercent: 0.9, path: '/data', key: 'custom_storage' },
      };
      const customService = new HealthService(
        healthCheckService,
        diskHealthIndicator,
        prismaHealthIndicator,
        memoryHealthIndicator,
        prismaClientService,
        customConfig,
      );

      const mockResult = { custom_storage: { status: 'up' } };
      diskHealthIndicator.checkStorage.mockResolvedValue(mockResult);

      await customService.checkDisk();

      expect(diskHealthIndicator.checkStorage).toHaveBeenCalledWith(
        'custom_storage',
        { thresholdPercent: 0.9, path: '/data' },
      );
    });
  });
});
