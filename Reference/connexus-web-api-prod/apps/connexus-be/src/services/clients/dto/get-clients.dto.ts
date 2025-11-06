import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClientStatus, ClientTypes } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';

export class GetClientsDto extends PaginationInput {
  @ApiPropertyOptional({
    description: 'Search string for client name or legal name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter for approved vendors only' })
  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  onlyApprovedVendors?: boolean;

  @ApiPropertyOptional({ description: 'Filter for non approved vendors only' })
  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  nonApprovedVendors?: boolean;

  @ApiPropertyOptional({
    type: [ClientTypes],
    isArray: true,
    enum: ClientTypes,
    description: 'Multiple client types filter',
    name: 'types[]',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ClientTypes, { each: true })
  types?: ClientTypes[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Multiple parent company IDs filter',
    name: 'parentTenantIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  parentTenantIds?: string[];

  @ApiPropertyOptional({
    type: [ClientStatus],
    isArray: true,
    enum: ClientStatus,
    description: 'Multiple client status filter',
    name: 'status[]',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ClientStatus, { each: true })
  status?: ClientStatus[];

  // @ApiPropertyOptional({
  //   description: 'The field to sort by',
  //   default: 'name',
  //   enum: ['name', 'legalName', 'status', 'type', 'parentCompany'],
  //   enumName: 'ClientSortField',
  // })
  // @IsString()
  // @IsOptional()
  // @IsIn(['name', 'legalName', 'status', 'type', 'parentCompany'])
  // sort?: 'name' | 'legalName' | 'status' | 'type' | 'parentCompany';
}
