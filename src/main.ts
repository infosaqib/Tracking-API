import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger/logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { createSwagger } from './common/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiVersion = configService.get<string>('API_VERSION', 'v1');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security - Configure helmet to allow Scalar scripts
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: [
            "'self'",
            'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
            'https://unpkg.com/@scalar/api-reference',
          ],
        },
      },
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(compression());

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000').split(',');
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Setup Swagger and Scalar API Reference (BEFORE global prefix)
  if (nodeEnv !== 'production') {
    const baseUrl = `http://localhost:${port}`;
    createSwagger(app, {
      title: 'Tracking API',
      description:
        'Comprehensive e-commerce tracking API with real-time updates and multi-carrier support',
      version: apiVersion,
      apiPath: 'api-docs',
      apiRefPath: 'api-reference',
      baseUrl: baseUrl,
      servers: [
        {
          url: `${baseUrl}/api/${apiVersion}`,
          description: 'API Server',
        },
        {
          url: baseUrl,
          description: 'Local Server',
        },
      ],
    });
  }

  // Global prefix (after Swagger setup)
  app.setGlobalPrefix(`api/${apiVersion}`);

  // Health check endpoint (outside of global prefix)
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'API is running',
      timestamp: new Date().toISOString(),
      version: apiVersion,
      environment: nodeEnv,
      uptime: process.uptime(),
    });
  });

  // Root endpoint
  app.getHttpAdapter().get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Tracking API',
      version: apiVersion,
      documentation: '/api-docs',
      health: '/health',
    });
  });

  await app.listen(port);

  const logger = new LoggerService();
  const baseUrl = `http://localhost:${port}`;
  const apiBaseUrl = `${baseUrl}/api/${apiVersion}`;

  logger.log(`🚀 Application is running`);
  logger.log(`📍 Base URL: ${baseUrl}`);
  logger.log(`🔗 API Base: ${apiBaseUrl}`);
  logger.log(`💚 Health Check: ${baseUrl}/health`);
  logger.log(`📚 Environment: ${nodeEnv}`);
  logger.log(`🔖 API Version: ${apiVersion}`);

  if (nodeEnv !== 'production') {
    logger.log(`📖 Swagger UI: ${baseUrl}/api-docs`);
    logger.log(`📚 Scalar API Reference: ${baseUrl}/api-reference`);
    logger.log(`📄 OpenAPI JSON: ${baseUrl}/api-docs/swagger.json`);
    logger.log(`📦 Postman Collection: ${baseUrl}/api-docs/postman.json`);
  }
}

bootstrap();
