import { PrismaModule } from '@app/prisma';
import { SqsModule } from '@app/shared/sqs';
import { Module } from '@nestjs/common';
import { ExportDataService } from './export-data.service';

@Module({
  imports: [PrismaModule, SqsModule],
  providers: [ExportDataService],
  exports: [ExportDataService],
})
export class ExportDataModule {}
