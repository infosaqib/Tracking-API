import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ExportFileTypes } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';
import { GetClientScopeOfWorkDto } from './get-client-scope-of-work.dto';

export class StrippedClientSowFilter extends OmitType(GetClientScopeOfWorkDto, [
  'page',
  'limit',
]) {}

export class ExportClientSowDto {
  @ApiProperty({
    description: 'The format of the file to be exported',
    enum: ExportFileTypes,
  })
  @IsEnum(ExportFileTypes)
  fileType: ExportFileTypes;

  @ApiProperty({
    description: 'Filters for the client scope of work export',
    type: StrippedClientSowFilter,
  })
  @ValidateNested()
  @Type(() => StrippedClientSowFilter)
  filters: StrippedClientSowFilter;
}
