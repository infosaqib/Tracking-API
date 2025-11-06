import { ExportDataModule as ExportDataModuleLib } from '@app/export-data';
import { Module } from '@nestjs/common';
import { ExportDataController } from './export-data.controller';

@Module({
  imports: [ExportDataModuleLib],
  controllers: [ExportDataController],
})
export class ExportDataModule {}
