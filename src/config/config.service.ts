import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private nestConfigService: NestConfigService) {}

  get<T = any>(key: string, defaultValue?: T): T {
    return this.nestConfigService.get<T>(key, defaultValue);
  }

  getNumber(key: string, defaultValue?: number): number {
    return this.nestConfigService.get<number>(key, defaultValue);
  }

  getBoolean(key: string, defaultValue?: boolean): boolean {
    return this.nestConfigService.get<boolean>(key, defaultValue) ?? defaultValue;
  }

  getString(key: string, defaultValue?: string): string {
    return this.nestConfigService.get<string>(key, defaultValue);
  }

  getArray(key: string, defaultValue: string[] = []): string[] {
    const value = this.nestConfigService.get<string>(key);
    return value ? value.split(',').map((item) => item.trim()) : defaultValue;
  }
}

