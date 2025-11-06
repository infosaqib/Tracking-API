import { PaginationDto, SortDirection } from '@app/shared/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { ScopeOfWorkStatuses, ScopeOfWorkTypes } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class GetRfpScopeOfWorkDto extends PaginationDto {
  @ApiProperty({
    description: 'Search by SOW name or description',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by SOW status',
    required: false,
    enum: ScopeOfWorkStatuses,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(ScopeOfWorkStatuses, { each: true })
  @IsArray()
  scopeOfWorkStatus?: ScopeOfWorkStatuses[];

  @ApiProperty({
    description: 'Filter by SOW type',
    required: false,
    enum: ScopeOfWorkTypes,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(ScopeOfWorkTypes, { each: true })
  @IsArray()
  scopeOfWorkType?: ScopeOfWorkTypes[];

  @ApiProperty({
    description: 'Filter by service ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({
    description: 'Filter by property IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  propertyIds?: string[];

  @ApiProperty({
    description: 'Filter by property status',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  propertyStatus?: string[];

  @ApiProperty({
    description: 'Filter by property type',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  propertyType?: string[];

  @ApiProperty({
    description: 'Filter by city IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  cityIds?: string[];

  @ApiProperty({
    description: 'Filter by state IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  stateIds?: string[];

  @ApiProperty({
    description: 'Filter by country IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  countryIds?: string[];

  @ApiProperty({
    description: 'Sort field',
    required: false,
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiProperty({
    description: 'Sort direction',
    required: false,
    enum: SortDirection,
  })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;

  @ApiProperty({
    description: 'Limit number of properties per record',
    required: false,
    default: 3,
  })
  @IsOptional()
  propertyLimitPerRecord?: number;
}
