import { PrismaModule } from '@app/prisma';
import { TerminusModule } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthModule } from './health.module';
import { HealthService } from './health.service';
import {
  DEFAULT_HEALTH_CONFIG,
  HEALTH_CONFIG,
} from './interfaces/health-config.interface';

describe('HealthModule', () => {
  describe('forRoot', () => {
    it('should create module with default configuration', async () => {
      const dynamicModule = HealthModule.forRoot();

      expect(dynamicModule.module).toBe(HealthModule);
      expect(dynamicModule.imports).toEqual([TerminusModule, PrismaModule]);
      expect(dynamicModule.controllers).toEqual([HealthController]);
      expect(dynamicModule.exports).toEqual([HealthService]);

      const configProvider = dynamicModule.providers?.find(
        (provider: any) => provider.provide === HEALTH_CONFIG,
      );
      expect(configProvider).toBeDefined();
      expect(configProvider?.useValue).toEqual(DEFAULT_HEALTH_CONFIG);
    });

    it('should create module with custom configuration', async () => {
      const customConfig = {
        database: { timeout: 5000, key: 'custom_db' },
        enabledChecks: ['database'] as const,
      };

      const dynamicModule = HealthModule.forRoot(customConfig);

      const configProvider = dynamicModule.providers?.find(
        (provider: any) => provider.provide === HEALTH_CONFIG,
      );

      expect(configProvider?.useValue).toEqual({
        ...DEFAULT_HEALTH_CONFIG,
        ...customConfig,
      });
    });

    it('should be able to compile the module', async () => {
      const dynamicModule = HealthModule.forRoot();

      const module: TestingModule = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();

      const healthService = module.get<HealthService>(HealthService);
      const healthController = module.get<HealthController>(HealthController);

      expect(healthService).toBeDefined();
      expect(healthController).toBeDefined();
    });
  });

  describe('forRootAsync', () => {
    it('should create module with async configuration', async () => {
      const asyncOptions = {
        useFactory: () => ({
          database: { timeout: 8000 },
          enabledChecks: ['database', 'memory'] as const,
        }),
        inject: [],
      };

      const dynamicModule = HealthModule.forRootAsync(asyncOptions);

      expect(dynamicModule.module).toBe(HealthModule);
      expect(dynamicModule.imports).toEqual([TerminusModule, PrismaModule]);
      expect(dynamicModule.controllers).toEqual([HealthController]);
      expect(dynamicModule.exports).toEqual([HealthService]);

      const configProvider = dynamicModule.providers?.find(
        (provider: any) => provider.provide === HEALTH_CONFIG,
      );
      expect(configProvider).toBeDefined();
      expect(configProvider?.useFactory).toBe(asyncOptions.useFactory);
      expect(configProvider?.inject).toEqual([]);
    });

    it('should include additional imports when provided', async () => {
      const MockModule = class {};
      const asyncOptions = {
        useFactory: () => ({}),
        imports: [MockModule],
      };

      const dynamicModule = HealthModule.forRootAsync(asyncOptions);

      expect(dynamicModule.imports).toEqual([
        TerminusModule,
        PrismaModule,
        MockModule,
      ]);
    });

    it('should be able to compile the async module', async () => {
      const asyncOptions = {
        useFactory: () => ({
          database: { timeout: 15000 },
        }),
      };

      const dynamicModule = HealthModule.forRootAsync(asyncOptions);

      const module: TestingModule = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();

      const healthService = module.get<HealthService>(HealthService);
      const healthController = module.get<HealthController>(HealthController);

      expect(healthService).toBeDefined();
      expect(healthController).toBeDefined();
    });
  });
});
