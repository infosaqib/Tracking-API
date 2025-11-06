import { IsArray, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class DatabaseHealthConfigDto {
  @IsOptional()
  @IsNumber()
  timeout?: number;

  @IsOptional()
  @IsString()
  key?: string;
}

export class MemoryHealthConfigDto {
  @IsOptional()
  @IsNumber()
  heapThreshold?: number;

  @IsOptional()
  @IsString()
  key?: string;
}

export class DiskHealthConfigDto {
  @IsOptional()
  @IsNumber()
  thresholdPercent?: number;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  key?: string;
}

export class HealthConfigDto {
  @IsOptional()
  database?: DatabaseHealthConfigDto;

  @IsOptional()
  memory?: MemoryHealthConfigDto;

  @IsOptional()
  disk?: DiskHealthConfigDto;

  @IsOptional()
  @IsArray()
  @IsIn(['database', 'memory', 'disk'], { each: true })
  enabledChecks?: ('database' | 'memory' | 'disk')[];
}

export interface HealthCheckResponse {
  status: 'ok' | 'error' | 'shutting_down';
  info?: Record<string, any>;
  error?: Record<string, any>;
  details: Record<string, any>;
}
