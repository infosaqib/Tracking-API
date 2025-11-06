import { NestFactory } from '@nestjs/core';
import { BackgroundJobsModule } from './background-jobs.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(BackgroundJobsModule);
}

bootstrap();
