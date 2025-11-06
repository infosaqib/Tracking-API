import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from './config/config.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get('docs')
  @ApiOperation({ summary: 'Get API documentation information' })
  getDocs() {
    return {
      success: true,
      message: 'API Documentation',
      version: this.configService.get<string>('API_VERSION', 'v1'),
      endpoints: {
        auth: '/api/v1/auth',
        products: '/api/v1/products',
        orders: '/api/v1/orders',
        tracking: '/api/v1/tracking',
        webhooks: '/api/v1/webhooks',
        monitoring: '/api/v1/monitoring',
      },
      documentation: '/api-docs',
    };
  }
}

