import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyBuildingTypes, PropertyStatuses } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';

export class GetPropertyDtoContract extends PaginationInput {
  @ApiPropertyOptional({
    description: 'Client ID of the property',
  })
  @IsOptional()
  @IsString()
  clientId: string;

  @ApiPropertyOptional({ description: 'Tenant ID of the property' })
  @IsOptional()
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ description: 'Search query of the property' })
  @IsOptional()
  @IsString()
  search: string;

  @ApiPropertyOptional({
    description: 'Filter by property IDs',
    name: 'propertiesId[]',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  propertiesId?: string[];

  @ApiPropertyOptional({
    description: 'Status of the property',
    enum: PropertyStatuses,
    enumName: 'PropertyStatuses',
  })
  @IsOptional()
  @IsEnum(PropertyStatuses)
  status: PropertyStatuses;

  @ApiPropertyOptional({
    description: 'Type of the property',
    enum: PropertyBuildingTypes,
    enumName: 'PropertyBuildingTypes',
  })
  @IsOptional()
  @IsEnum(PropertyBuildingTypes)
  type: PropertyBuildingTypes;

  @ApiPropertyOptional({ description: 'Is retail scope of the property' })
  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  isRetailScope: boolean;

  @ApiPropertyOptional({ description: 'Is retail of the property' })
  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  isRetail: boolean;

  @ApiPropertyOptional({
    description: 'City ID of the property',
    name: 'cityIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  cityIds: string[];

  @ApiPropertyOptional({
    description: 'State ID of the property',
    name: 'stateIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  stateIds: string[];

  @ApiPropertyOptional({
    description: 'Country ID of the property',
    name: 'countryIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  countryIds: string[];

  @ApiPropertyOptional({
    description: 'County ID of the property',
    name: 'countyIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  countyIds: string[];

  @ApiPropertyOptional({
    description: 'Manager ID of the property',
    name: 'managerIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  managerIds: string[];

  @ApiPropertyOptional({
    description: 'Excluded IDs of the property',
    name: 'excludeIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excludeIds: string[];

  @ApiPropertyOptional({
    description: 'Property manager email IDs',
    name: 'managerEmailIds[]',
  })
  @IsOptional()
  @IsArray()
  managerEmailIds: string[];

  @ApiPropertyOptional({
    description: 'Property address',
    name: 'propertyAddress',
  })
  @IsOptional()
  @IsString()
  propertyAddress: string;

  @ApiPropertyOptional({
    description: 'Service IDs',
    name: 'serviceIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds: string[];
}
