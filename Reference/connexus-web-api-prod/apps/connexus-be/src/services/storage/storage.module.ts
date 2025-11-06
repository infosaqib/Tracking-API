import { S3Module } from '@app/shared';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BackgroundJobsModule } from 'src/services/background-jobs/background-jobs.module';
import storageConfig from './configs/storage.config';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [storageConfig],
    }),
    forwardRef(() => BackgroundJobsModule),
    S3Module,
  ],
  providers: [StorageService],
  exports: [StorageService],
  controllers: [StorageController],
})
export class StorageModule {}
