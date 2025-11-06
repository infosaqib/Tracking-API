import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SqsModule } from '@ssut/nestjs-sqs';
import backgroundJobsConfig from './config/background-jobs.config';
import { ExportSqsListenerModule } from './modules/export-sqs-listener/export-sqs-listener.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [backgroundJobsConfig],
    }),
    ExportSqsListenerModule,
    SqsModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const exportQueueUrl = configService.get(
          'backgroundJobs.exportQueueUrl',
        );
        const region = configService.get('backgroundJobs.awsRegion');
        const accessKeyId = configService.get('backgroundJobs.awsAccessKeyId');
        const secretAccessKey = configService.get(
          'backgroundJobs.awsSecretAccessKey',
        );

        if (!exportQueueUrl) {
          throw new Error('EXPORT_QUEUE_URL is not configured');
        }

        return {
          consumers: [
            {
              name: 'export-queue',
              queueUrl: exportQueueUrl,
              region,
              credentials: {
                accessKeyId,
                secretAccessKey,
              },
            },
          ],
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class BackgroundJobsModule {}
