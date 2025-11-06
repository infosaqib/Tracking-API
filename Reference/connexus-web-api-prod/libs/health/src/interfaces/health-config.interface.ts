export interface DatabaseHealthConfig {
  timeout?: number;
  key?: string;
}

export interface MemoryHealthConfig {
  heapThreshold?: number;
  key?: string;
}

export interface DiskHealthConfig {
  thresholdPercent?: number;
  path?: string;
  key?: string;
}

export interface HealthConfig {
  database?: DatabaseHealthConfig;
  memory?: MemoryHealthConfig;
  disk?: DiskHealthConfig;
  enabledChecks?: ('database' | 'memory' | 'disk')[];
}

export interface HealthAsyncConfig {
  useFactory?: (...args: any[]) => Promise<HealthConfig> | HealthConfig;
  inject?: any[];
  imports?: any[];
}

export const DEFAULT_HEALTH_CONFIG: HealthConfig = {
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
};

export const HEALTH_CONFIG = 'HEALTH_CONFIG';
