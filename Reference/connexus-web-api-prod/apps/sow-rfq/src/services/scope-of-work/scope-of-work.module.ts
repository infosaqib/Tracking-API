import { ExportDataModule } from '@app/export-data';
import { PrismaModule } from '@app/prisma';
import { S3Module, SharedModule } from '@app/shared';
import { SqsModule } from '@app/shared/sqs';
import { Module, forwardRef } from '@nestjs/common';
import { OnlyOfficeModule } from '../only-office/only-office.module';
import { ScopeOfWorkController } from './scope-of-work.controller';
import { ScopeOfWorkService } from './scope-of-work.service';

@Module({
  imports: [
    PrismaModule,
    SharedModule,
    SqsModule,
    forwardRef(() => OnlyOfficeModule),
    S3Module,
    ExportDataModule,
  ],
  controllers: [ScopeOfWorkController],
  providers: [ScopeOfWorkService],
  exports: [ScopeOfWorkService],
})
export class ScopeOfWorkModule {}
