import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType, TenantTypes, UserStatus } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';

export class GetUserDto extends PaginationInput {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tenantId: string;

  @ApiPropertyOptional({
    isArray: true,
    type: 'string',
    name: 'tenantIds[]',
  })
  @IsArray()
  @IsOptional()
  tenantIds: string[];

  @ApiPropertyOptional({
    isArray: true,
    type: 'string',
    name: 'roleIds[]',
    default: [],
  })
  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  roleIds: string[];

  @ApiPropertyOptional({
    name: 'status[]',
    enum: UserStatus,
    isArray: true,
    type: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus, { each: true })
  @IsArray()
  @ArrayMinSize(1)
  status: UserStatus[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search: string;

  @ApiPropertyOptional()
  @TransformBoolean()
  @IsBoolean()
  @IsOptional()
  authorized: boolean;

  @ApiPropertyOptional({
    name: 'contactType[]',
    enum: ContactType,
    isArray: true,
    type: ContactType,
  })
  @IsOptional()
  @IsEnum(ContactType, { each: true })
  @IsArray()
  @ArrayMinSize(1)
  contactType: ContactType[];

  @ApiPropertyOptional({ description: 'Property managers only ' })
  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  propertyManagersOnly: boolean;

  @ApiPropertyOptional({
    isArray: true,
    type: 'string',
    name: 'parentTenantIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  parentTenantIds: string[];

  @ApiPropertyOptional({
    name: 'tenantType',
    enum: TenantTypes,
    type: TenantTypes,
  })
  @IsEnum(TenantTypes)
  @IsOptional()
  tenantType: TenantTypes;

  @ApiPropertyOptional({
    name: 'filterUserTenantsAlso',
    type: 'boolean',
    description:
      'If true, the user tenants will also be filtered by the tenantId',
  })
  @IsBoolean()
  @IsOptional()
  filterUserTenantsAlso: boolean;
}
