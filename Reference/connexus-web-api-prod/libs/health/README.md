# Health Library

A shared NestJS health check library for the Connexus monorepo that provides standardized health monitoring across all applications.

## Features

- **Database connectivity checks** - Monitor database connection health with configurable timeouts
- **Memory usage monitoring** - Track heap memory usage with customizable thresholds
- **Disk storage monitoring** - Check available disk space with configurable limits
- **Configurable health checks** - Enable/disable specific checks as needed
- **Backward compatible** - Maintains existing `/health` endpoint behavior
- **TypeScript support** - Full type safety with comprehensive interfaces

## Installation

The library is already configured in the monorepo. Import it using the path mapping:

```typescript
import { HealthModule } from '@app/health';
```

## Basic Usage

### Simple Configuration

```typescript
import { Module } from '@nestjs/common';
import { HealthModule } from '@app/health';

@Module({
  imports: [
    HealthModule.forRoot(), // Uses default configuration
  ],
})
export class AppModule {}
```

### Custom Configuration

```typescript
import { Module } from '@nestjs/common';
import { HealthModule } from '@app/health';

@Module({
  imports: [
    HealthModule.forRoot({
      database: {
        timeout: 10000,
        key: 'database',
      },
      memory: {
        heapThreshold: 150 * 1024 * 1024, // 150MB
        key: 'memory_heap',
      },
      disk: {
        thresholdPercent: 0.8,
        path: '/',
        key: 'storage',
      },
      enabledChecks: ['database', 'memory', 'disk'],
    }),
  ],
})
export class AppModule {}
```

### Async Configuration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthModule } from '@app/health';

@Module({
  imports: [
    ConfigModule,
    HealthModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        database: {
          timeout: configService.get('HEALTH_DB_TIMEOUT', 10000),
        },
        memory: {
          heapThreshold: configService.get(
            'HEALTH_MEMORY_THRESHOLD',
            150 * 1024 * 1024,
          ),
        },
        enabledChecks: configService
          .get('HEALTH_ENABLED_CHECKS', 'database,memory,disk')
          .split(','),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## Configuration Options

### HealthConfig Interface

```typescript
interface HealthConfig {
  database?: DatabaseHealthConfig;
  memory?: MemoryHealthConfig;
  disk?: DiskHealthConfig;
  enabledChecks?: ('database' | 'memory' | 'disk')[];
}
```

### Database Health Configuration

```typescript
interface DatabaseHealthConfig {
  timeout?: number; // Connection timeout in milliseconds (default: 10000)
  key?: string; // Key name in response (default: 'database')
}
```

### Memory Health Configuration

```typescript
interface MemoryHealthConfig {
  heapThreshold?: number; // Heap memory threshold in bytes (default: 150MB)
  key?: string; // Key name in response (default: 'memory_heap')
}
```

### Disk Health Configuration

```typescript
interface DiskHealthConfig {
  thresholdPercent?: number; // Disk usage threshold (0-1) (default: 0.8)
  path?: string; // Path to check (default: '/')
  key?: string; // Key name in response (default: 'storage')
}
```

## Default Configuration

```typescript
{
  database: {
    timeout: 10000,
    key: 'database',
  },
  memory: {
    heapThreshold: 150 * 1024 * 1024, // 150MB
    key: 'memory_heap',
  },
  disk: {
    thresholdPercent: 0.8,
    path: '/',
    key: 'storage',
  },
  enabledChecks: ['database', 'memory', 'disk'],
}
```

## Health Check Endpoint

Once configured, the health checks are available at:

```
GET /health
```

### Response Format

**Healthy Response (200 OK):**

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "storage": { "status": "up" }
  },
  "details": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "storage": { "status": "up" }
  }
}
```

**Unhealthy Response (503 Service Unavailable):**

```json
{
  "status": "error",
  "error": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    }
  },
  "details": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    },
    "memory_heap": { "status": "up" },
    "storage": { "status": "up" }
  }
}
```

## Custom Health Checks

You can also use the `HealthService` directly for custom health check logic:

```typescript
import { Injectable } from '@nestjs/common';
import { HealthService } from '@app/health';

@Injectable()
export class CustomHealthService {
  constructor(private readonly healthService: HealthService) {}

  async getCustomHealthStatus() {
    const result = await this.healthService.performHealthChecks();

    // Add custom logic here
    return {
      ...result,
      customCheck: { status: 'up' },
    };
  }
}
```

## Migration Guide

### From Existing Health Modules

1. **Remove existing health module imports:**

   ```typescript
   // Remove this
   import { HealthModule } from './services/health/health.module';
   ```

2. **Add shared health library import:**

   ```typescript
   // Add this
   import { HealthModule } from '@app/health';
   ```

3. **Update module configuration:**

   ```typescript
   @Module({
     imports: [
       // Replace this
       HealthModule,

       // With this
       HealthModule.forRoot({
         // Your existing configuration
       }),
     ],
   })
   ```

4. **Remove duplicate health files:**
   - Delete `src/services/health/` directory
   - Remove health-related imports and providers

## Testing

The library includes comprehensive unit and integration tests. Run tests with:

```bash
npm test -- --testPathPattern=libs/health
```

## Dependencies

- `@nestjs/terminus` - NestJS health check framework
- `@app/prisma` - Database client for health checks

## Contributing

When adding new health check types:

1. Update the `HealthConfig` interface
2. Add the new health check method to `HealthService`
3. Update the `enabledChecks` type union
4. Add comprehensive tests
5. Update this documentation
