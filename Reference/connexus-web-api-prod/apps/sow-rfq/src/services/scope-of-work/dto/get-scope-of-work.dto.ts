import { PaginationDto, SortDirection } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScopeOfWorkStatuses, ScopeOfWorkTypes } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

export class GetScopeOfWorkDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by scope name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by scope type',
    enum: ScopeOfWorkTypes,
  })
  @IsEnum(ScopeOfWorkTypes)
  @IsOptional()
  scopeType?: ScopeOfWorkTypes;

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
    description: 'Filter by updated start date',
  })
  @IsString()
  @IsOptional()
  updatedStartDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by updated end date',
  })
  @IsString()
  @IsOptional()
  updatedEndDate?: string;

  @ApiPropertyOptional({
    description: 'The direction of the sort',
    default: 'asc',
    enum: SortDirection,
  })
  @IsString()
  @IsOptional()
  @IsIn(Object.values(SortDirection))
  sortDirection?: SortDirection = SortDirection.DESC;
}
