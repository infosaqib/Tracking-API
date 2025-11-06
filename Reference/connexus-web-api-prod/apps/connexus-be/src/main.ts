import { BootstrapService } from '@app/core';
import { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { instance } from './libs/logger/winston.logger';
import './libs/sentry/instrument';

const isProduction = process.env.NODE_ENV === 'production';

async function bootstrap() {
  const option: NestApplicationOptions = {};

  if (isProduction) {
    option.logger =
      isProduction &&
      WinstonModule.createLogger({
        instance,
      });
  }

  const app = await NestFactory.create(AppModule, option);

  const bootstrapService = app.get(BootstrapService);
  const port = bootstrapService.getBasePort();

  await bootstrapService.bootstrap(app, {
    port,
    corsOrigin: '*',
    swaggerOptions: {
      title: 'Connexus API',
      description: 'Connexus API description',
      version: '1.0',
    },
  });
}

bootstrap();
