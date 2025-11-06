import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ExportFileTypes } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';
import { GetPropertyDto } from './get-property.dto';

export class StrippedPropertyFilter extends OmitType(GetPropertyDto, [
  'page',
  'limit',
]) {}

export class ExportPropertyDto {
  @ApiProperty({
    description: 'The format of the file to be exported',
    enum: ExportFileTypes,
  })
  @IsEnum(ExportFileTypes)
  fileType: ExportFileTypes;

  @ApiProperty({
    description: 'Filters for the property export',
    type: StrippedPropertyFilter,
  })
  @ValidateNested()
  @Type(() => StrippedPropertyFilter)
  filters: StrippedPropertyFilter;
}
