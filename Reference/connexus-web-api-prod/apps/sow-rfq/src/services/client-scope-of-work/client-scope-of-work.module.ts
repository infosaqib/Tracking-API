import { ExportDataModule } from '@app/export-data';
import { PrismaModule } from '@app/prisma';
import { S3Module } from '@app/shared/s3';
import { SqsModule } from '@app/shared/sqs';
import { Module } from '@nestjs/common';
import { OnlyOfficeModule } from '../only-office/only-office.module';
import { ClientScopeOfWorkController } from './client-scope-of-work.controller';
import { ClientScopeOfWorkService } from './client-scope-of-work.service';

@Module({
  imports: [
    PrismaModule,
    SqsModule,
    OnlyOfficeModule,
    S3Module,
    ExportDataModule,
  ],
  controllers: [ClientScopeOfWorkController],
  providers: [ClientScopeOfWorkService],
  exports: [ClientScopeOfWorkService],
})
export class ClientScopeOfWorkModule {}
