import { PaginationDto, SortDirection } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScopeOfWorkStatuses } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
} from 'class-validator';

export class GetClientScopeOfWorkDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by scope name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    name: 'scopeOfWorkStatus[]',
    description: 'Filter by scope status (multi-select)',
    enum: ScopeOfWorkStatuses,
    isArray: true,
  })
  @IsEnum(ScopeOfWorkStatuses, { each: true })
  @IsOptional()
  scopeOfWorkStatus?: ScopeOfWorkStatuses[];

  @ApiPropertyOptional({
    name: 'serviceId[]',
    description: 'Filter by service ID (multi-select)',
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  serviceId?: string[];

  @ApiPropertyOptional({
    name: 'clientId[]',
    description: 'Filter by client ID (multi-select)',
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  clientId?: string[];

  @ApiPropertyOptional({
    name: 'propertyId[]',
    description: 'Filter by property ID (multi-select)',
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  propertyId?: string[];

  @ApiPropertyOptional({
    name: 'createdById[]',
    description: 'Filter by creator ID (multi-select)',
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  createdById?: string[];

  @ApiPropertyOptional({
    name: 'modifiedById[]',
    description: 'Filter by modified ID (multi-select)',
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  modifiedById?: string[];

  @ApiPropertyOptional({
    description: 'Filter by created start date',
  })
  @IsString()
  @IsOptional()
  createdStartDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by created end date',
  })
  @IsString()
  @IsOptional()
  createdEndDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by updated start date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  updatedStartDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by updated end date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  updatedEndDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by uploaded start date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  uploadedStartDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by uploaded end date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  uploadedEndDate?: string;

  @ApiPropertyOptional({
    description: 'The direction of the sort',
    default: SortDirection.DESC,
    enum: SortDirection,
  })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection = SortDirection.DESC;

  @ApiPropertyOptional({
    description: 'The number of properties to return per record',
    default: 5,
  })
  @IsNumber()
  @IsOptional()
  @Max(10)
  propertyLimitPerRecord?: number;
}
