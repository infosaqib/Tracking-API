import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ExportFileTypes } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';
import { GetScopeOfWorkDto } from './get-scope-of-work.dto';

export class StrippedFilter extends OmitType(GetScopeOfWorkDto, [
  'page',
  'limit',
]) {}

export class ExportSowDto {
  @ApiProperty({
    description: 'The format of the file to be exported',
    enum: ExportFileTypes,
  })
  @IsEnum(ExportFileTypes)
  fileType: ExportFileTypes;

  @ApiProperty({
    description: 'Filters for the scope of work export',
    type: StrippedFilter,
  })
  @ValidateNested()
  @Type(() => StrippedFilter)
  filters: StrippedFilter;
}
