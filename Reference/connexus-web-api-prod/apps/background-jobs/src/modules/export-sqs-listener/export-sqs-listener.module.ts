import { PrismaModule } from '@app/prisma';
import { S3Module } from '@app/shared/s3';
import { Module } from '@nestjs/common';
import { ExportSqsListenerController } from './export-sqs-listener.controller';
import { ExportSqsListenerService } from './export-sqs-listener.service';
import { ExportFactoryService } from './factories/export-factory.service';
import { ClientSowExportHandler } from './handlers/client-sow-export.handler';
import { PropertyExportHandler } from './handlers/property-export.handler';
import { SowExportHandler } from './handlers/sow-export.handler';
import { ExportDatabaseService } from './utils/export-database.service';
import { FileGeneratorService } from './utils/file-generator.service';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [ExportSqsListenerController],
  providers: [
    ExportSqsListenerService,
    ExportFactoryService,
    SowExportHandler,
    PropertyExportHandler,
    ClientSowExportHandler,
    ExportDatabaseService,
    FileGeneratorService,
  ],
})
export class ExportSqsListenerModule {}
