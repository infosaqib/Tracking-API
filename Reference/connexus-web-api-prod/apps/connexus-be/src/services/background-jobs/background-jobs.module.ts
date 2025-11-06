import { SqsModule } from '@app/shared/sqs';
import { Module, forwardRef } from '@nestjs/common';
import { StorageModule } from 'src/services/storage/storage.module';
import { ClientsModule } from '../clients/clients.module';
import { BackgroundJobsController } from './background-jobs.controller';
import { BackgroundJobsService } from './background-jobs.service';

@Module({
  controllers: [BackgroundJobsController],
  providers: [BackgroundJobsService],
  imports: [SqsModule, forwardRef(() => StorageModule), ClientsModule],
  exports: [BackgroundJobsService],
})
export class BackgroundJobsModule {}
