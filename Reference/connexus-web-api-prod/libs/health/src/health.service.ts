import { PrismaService as PrismaClientService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import {
  DEFAULT_HEALTH_CONFIG,
  HEALTH_CONFIG,
  HealthConfig,
} from './interfaces/health-config.interface';

@Injectable()
export class HealthService {
  private readonly config: HealthConfig;

  constructor(
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
    private readonly db: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaClientService,
    @Inject(HEALTH_CONFIG) config?: HealthConfig,
  ) {
    this.config = { ...DEFAULT_HEALTH_CONFIG, ...config };
  }

  async performHealthChecks(): Promise<HealthCheckResult> {
    const checks = [];
    const enabledChecks = this.config.enabledChecks || [
      'database',
      'memory',
      'disk',
    ];

    if (enabledChecks.includes('database')) {
      checks.push(() => this.checkDatabase());
    }

    if (enabledChecks.includes('memory')) {
      checks.push(() => this.checkMemory());
    }

    if (enabledChecks.includes('disk')) {
      checks.push(() => this.checkDisk());
    }

    return this.health.check(checks);
  }

  async checkDatabase(): Promise<HealthIndicatorResult> {
    const dbConfig = {
      ...DEFAULT_HEALTH_CONFIG.database,
      ...this.config.database,
    };
    return this.db.pingCheck(dbConfig.key!, this.prisma.client, {
      timeout: dbConfig.timeout,
    });
  }

  async checkMemory(): Promise<HealthIndicatorResult> {
    const memoryConfig = {
      ...DEFAULT_HEALTH_CONFIG.memory,
      ...this.config.memory,
    };
    return this.memory.checkHeap(
      memoryConfig.key!,
      memoryConfig.heapThreshold!,
    );
  }

  async checkDisk(): Promise<HealthIndicatorResult> {
    const diskConfig = { ...DEFAULT_HEALTH_CONFIG.disk, ...this.config.disk };
    return this.disk.checkStorage(diskConfig.key!, {
      thresholdPercent: diskConfig.thresholdPercent!,
      path: diskConfig.path!,
    });
  }
}
