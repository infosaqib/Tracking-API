import { BootstrapService } from '@app/core';
import { NestFactory } from '@nestjs/core';
import { SowRfqModule } from './sow-rfq.module';

async function bootstrap() {
  const app = await NestFactory.create(SowRfqModule);

  const bootstrapService = app.get(BootstrapService);

  const port = bootstrapService.getBasePort() + 1;

  await bootstrapService.bootstrap(app, {
    port,
    swaggerOptions: {
      title: 'SOW RFQ API',
      description: 'Sope of Work and Request for Quote API',
      version: '1.0',
      servers: [
        {
          url: `http://localhost:${port}`,
          description: 'Local Server',
        },
        {
          url: `${bootstrapService.getBaseUrl()}/sowrfq`,
          description:
            `${process.env.NODE_ENV || 'Development'} Server`.toUpperCase(),
        },
      ],
    },
    validatorOptions: {
      forbidUnknownValues: true,
    },
    globalPrefix: 'sowrfq',
  });
}

bootstrap();
