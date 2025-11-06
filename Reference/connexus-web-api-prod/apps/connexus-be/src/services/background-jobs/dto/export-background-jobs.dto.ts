import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ExportFormat } from '../../contracts/dto/export-format-type';
import { GetJobsDto } from './get-jobs.dto';

export class ExportBackgroundJobsDto extends GetJobsDto {
  @ApiProperty({
    enum: ExportFormat,
    description: 'Export format (csv, xlsx, or pdf)',
    default: ExportFormat.XLSX,
  })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat = ExportFormat.XLSX;
}
