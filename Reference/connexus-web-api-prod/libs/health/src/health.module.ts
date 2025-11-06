import { PrismaModule } from '@app/prisma';
import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import {
  DEFAULT_HEALTH_CONFIG,
  HEALTH_CONFIG,
  HealthAsyncConfig,
  HealthConfig,
} from './interfaces/health-config.interface';

@Module({})
export class HealthModule {
  static forRoot(config?: HealthConfig): DynamicModule {
    const healthConfig = { ...DEFAULT_HEALTH_CONFIG, ...config };

    return {
      module: HealthModule,
      imports: [TerminusModule, PrismaModule],
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: HEALTH_CONFIG,
          useValue: healthConfig,
        },
      ],
      exports: [HealthService],
    };
  }

  static forRootAsync(options: HealthAsyncConfig): DynamicModule {
    return {
      module: HealthModule,
      imports: [TerminusModule, PrismaModule, ...(options.imports || [])],
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: HEALTH_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ],
      exports: [HealthService],
    };
  }
}
