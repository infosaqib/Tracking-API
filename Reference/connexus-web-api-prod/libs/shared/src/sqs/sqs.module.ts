import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import sqsConfig from './config/sqs.config';
import { SqsController } from './sqs.controller';
import { SqsService } from './sqs.service';

@Module({
  controllers: [SqsController],
  providers: [SqsService],
  exports: [SqsService],
  imports: [
    ConfigModule.forRoot({
      load: [sqsConfig],
    }),
  ],
})
export class SqsModule {}
