import { TransformArray } from '@app/shared/decorators';
import { PaginationDto, SortDirection } from '@app/shared/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { PropertyBuildingTypes, PropertyStatuses } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class GetRfpPropertiesDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by RFP ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  rfpId?: string;

  @ApiProperty({
    description: 'Search by property name, address, or zip',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by property status',
    required: false,
    enum: PropertyStatuses,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(PropertyStatuses, { each: true })
  @IsArray()
  @TransformArray()
  status?: PropertyStatuses[];

  @ApiProperty({
    description: 'Filter by property type',
    required: false,
    enum: PropertyBuildingTypes,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(PropertyBuildingTypes, { each: true })
  @IsArray()
  @TransformArray()
  type?: PropertyBuildingTypes[];

  @ApiProperty({
    description: 'Filter by city IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  cityIds?: string[];

  @ApiProperty({
    description: 'Filter by state IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  stateIds?: string[];

  @ApiProperty({
    description: 'Filter by country IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  countryIds?: string[];

  @ApiProperty({
    description: 'Filter by county IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  countyIds?: string[];

  @ApiProperty({
    description: 'Filter by property manager IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  managerIds?: string[];

  @ApiProperty({
    description: 'Filter by property manager email IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  managerEmailIds?: string[];

  @ApiProperty({
    description: 'Filter by property address',
    required: false,
  })
  @IsOptional()
  @IsString()
  propertyAddress?: string;

  @ApiProperty({
    description: 'Filter by client ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({
    description: 'Filter by tenant ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({
    description: 'Exclude specific property IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  excludeIds?: string[];

  @ApiProperty({
    description: 'Filter by specific property IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  propertiesId?: string[];

  @ApiProperty({
    description: 'Filter by service IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  serviceIds?: string[];

  @ApiProperty({
    description: 'Filter by retail scope',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRetailScope?: boolean;

  @ApiProperty({
    description: 'Filter by retail property',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRetail?: boolean;

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
}
