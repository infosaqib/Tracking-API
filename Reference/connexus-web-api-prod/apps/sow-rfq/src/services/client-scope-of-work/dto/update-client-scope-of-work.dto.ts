import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScopeOfWorkStatuses, SowThemeTypes } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateClientScopeOfWorkDto {
  @ApiPropertyOptional({
    description: 'The name of the scope of work',
    maxLength: 250,
  })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  scopeName?: string;

  @ApiPropertyOptional({
    description: 'Description of the scope of work',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the scope of work',
    enum: ScopeOfWorkStatuses,
  })
  @IsEnum(ScopeOfWorkStatuses)
  @IsOptional()
  scopeOfWorkStatus?: ScopeOfWorkStatuses;

  @ApiPropertyOptional({
    description: 'Theme type for the scope of work',
    enum: SowThemeTypes,
  })
  @IsEnum(SowThemeTypes)
  @IsOptional()
  themeType?: SowThemeTypes;

  @ApiPropertyOptional({
    description: 'The service associated with the scope of work',
  })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'The properties to update',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  propertyIds?: string[];
}
