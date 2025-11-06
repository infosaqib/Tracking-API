import {
  INestApplication,
  Injectable,
  Logger,
  ValidationPipe,
  ValidationPipeOptions,
  VersioningType,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaClientExceptionFilter } from 'nestjs-prisma';
import { envValues } from '../constants';
import { PRISMA_ERROR_STATUS } from '../constants/prisma-error-status';
import { VALIDATOR_OPTIONS } from '../constants/validator-options';
import { HttpExceptionFilter } from '../filters/http-error/http-error.filter';
import { createSwagger, SwaggerOptions } from '../swagger/swagger';

export interface BootstrapOptions {
  port?: number;
  corsOrigin?: string | string[];
  swaggerOptions?: {
    title: string;
    description: string;
    version: string;
    servers?: SwaggerOptions['servers'];
  };
  enableSwagger?: boolean;
  validatorOptions?: ValidationPipeOptions;
  globalPrefix?: string;
}

const defaultOptions: BootstrapOptions = {
  port: 3000,
  corsOrigin: '*',
  enableSwagger: process.env.NODE_ENV !== 'production',
};

@Injectable()
export class BootstrapService {
  private readonly logger = new Logger(BootstrapService.name);

  private readonly isProduction = process.env.NODE_ENV === 'production';

  /**
   * Configure and bootstrap a NestJS application with common settings
   * @param app The NestJS application instance
   * @param options Configuration options for the bootstrap process
   */
  async bootstrap(
    app: INestApplication,
    options: BootstrapOptions = {},
  ): Promise<void> {
    const mergedOptions = { ...defaultOptions, ...options };

    this.configureVersioning(app);
    this.configureGlobalPrefix(app, mergedOptions.globalPrefix);
    this.configureMiddlewares(app, mergedOptions.corsOrigin);
    this.configureValidation(app, {
      ...VALIDATOR_OPTIONS,
      ...mergedOptions.validatorOptions,
    });
    this.configureErrorHandling(app);

    if (mergedOptions.enableSwagger && !this.isProduction) {
      this.configureSwagger(app, mergedOptions.swaggerOptions);
    }

    const port = Number(mergedOptions.port || process.env.PORT || 3000);
    await app.listen(port);

    await this.logApplicationInfo(app);
  }

  private configureVersioning(app: INestApplication): void {
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
  }

  private configureGlobalPrefix(
    app: INestApplication,
    globalPrefix?: string,
  ): void {
    if (globalPrefix) {
      app.setGlobalPrefix(globalPrefix);
    }
  }

  private configureMiddlewares(
    app: INestApplication,
    corsOrigin: string | string[],
  ): void {
    // app.use(
    //   helmet({
    //     contentSecurityPolicy: {
    //       directives: {
    //         scriptSrc: [
    //           "'self'",
    //           'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
    //         ],
    //       },
    //     },
    //     crossOriginResourcePolicy: false,
    //   }),
    // );

    app.enableCors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'baggage',
        'sentry-trace',
      ],
    });

    app.enableShutdownHooks();
  }

  private configureValidation(
    app: INestApplication,
    validatorOptions: ValidationPipeOptions,
  ): void {
    app.useGlobalPipes(new ValidationPipe(validatorOptions));
  }

  private configureErrorHandling(app: INestApplication): void {
    app.useGlobalFilters(new HttpExceptionFilter());

    if (this.isProduction) {
      const { httpAdapter } = app.get(HttpAdapterHost);
      app.useGlobalFilters(
        new PrismaClientExceptionFilter(httpAdapter, PRISMA_ERROR_STATUS),
      );
    }
  }

  private configureSwagger(
    app: INestApplication,
    options: BootstrapOptions['swaggerOptions'],
  ): void {
    if (options) {
      createSwagger(app, options);
    } else {
      createSwagger(app, {
        title: 'API Documentation',
        description: 'API Documentation',
        version: '1.0',
      });
    }
  }

  private async logApplicationInfo(app: INestApplication): Promise<void> {
    let appUrl = await app.getUrl();
    appUrl = `${appUrl.replace('[::1]', 'localhost')}`;

    this.logger.log(
      `Application is running on: ${appUrl} in ${process.env.NODE_ENV || 'development'} mode`,
    );

    if (!this.isProduction) {
      this.logger.log(`Swagger is running on: ${appUrl}/api-docs`);
      this.logger.log(`API Reference is running on: ${appUrl}/api-reference`);
    }
  }

  getBasePort(): number {
    const port = Number(envValues.port || 3000);

    if (Number.isNaN(port)) {
      throw new Error('Invalid port number');
    }

    this.logger.log(`Base port: ${port}`);

    return port;
  }

  getSubDomain(): string {
    if (process.env.NODE_ENV === 'development') {
      return 'dev-api';
    }

    if (process.env.NODE_ENV === 'test') {
      return 'test-api';
    }

    if (process.env.NODE_ENV === 'staging') {
      return 'stge-api';
    }

    if (process.env.NODE_ENV === 'production') {
      return 'api';
    }

    return '';
  }

  getBaseUrl(): string {
    return `https://${this.getSubDomain()}.joinconnexus.com`;
  }
}
