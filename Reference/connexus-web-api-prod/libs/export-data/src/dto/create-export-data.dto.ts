import { ExportFileTypes } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';

export enum ExportRequestTypes {
  SOW_LIBRARY = 'Sow Library',
  CLIENT_SOW = 'Client Sow',
  RFP = 'RFP',
  PROPERTIES = 'Properties',
}

export class CreateExportDataDto {
  @IsEnum(ExportRequestTypes)
  type: ExportRequestTypes;

  @IsEnum(ExportFileTypes)
  fileType: ExportFileTypes;

  @IsUUID()
  createdById: string;

  @IsOptional()
  @IsObject()
  filters?: object;

  @IsOptional()
  @IsObject()
  sort?: object;
}
