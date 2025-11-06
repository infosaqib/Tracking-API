import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  TenantTypes,
  VendorRegistrationType,
  VendorStages,
  VendorStatuses,
  VendorUnionTypes,
} from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';

export class GetVendorsDto extends PaginationInput {
  @ApiPropertyOptional({ description: 'Search vendors by name or legal name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by vendor stage',
    enum: VendorStages,
  })
  @IsOptional()
  @IsEnum(VendorStages)
  stage?: VendorStages;

  @ApiPropertyOptional({
    description: 'Filter by vendor union type',
    enum: VendorUnionTypes,
  })
  @IsOptional()
  @IsEnum(VendorUnionTypes)
  vendorUnion?: VendorUnionTypes;

  @ApiPropertyOptional({ description: 'Filter by tenant ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Filter by parent vendor ID',
    isArray: true,
    type: String,
    name: 'parentVendorIds[]',
  })
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  parentVendorIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by vendor type',
    enum: VendorUnionTypes,
  })
  @IsOptional()
  @IsEnum(VendorUnionTypes)
  type?: VendorUnionTypes;

  @ApiPropertyOptional({
    description: 'Filter tenant types',
    isArray: true,
    enum: TenantTypes,
    enumName: 'TenantTypes',
    type: [TenantTypes],
    name: 'tenantTypes[]',
  })
  @IsOptional()
  @IsEnum(TenantTypes, { each: true })
  @IsArray()
  tenantTypes?: TenantTypes[];

  @ApiPropertyOptional({
    description: 'Filter by vendor registration type',
    enum: VendorRegistrationType,
  })
  @IsOptional()
  @IsEnum(VendorRegistrationType)
  registrationType?: VendorRegistrationType;

  @ApiPropertyOptional({
    description: 'Filter by vendor status',
    isArray: true,
    name: 'status[]',
    enumName: 'VendorStatuses',
    enum: VendorStatuses,
  })
  @IsOptional()
  @IsEnum(VendorStatuses, { each: true })
  status?: VendorStatuses[];

  @ApiPropertyOptional({
    description: 'Filter by service IDs',
    isArray: true,
    type: String,
    name: 'serviceIds[]',
  })
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  serviceIds?: string[];

  @ApiPropertyOptional({
    description:
      'Filter by has children, only `true` will return vendors with children',
  })
  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  hasChildren?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by w9 attached',
  })
  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  w9Attached?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by Certificate of Insurance added',
  })
  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  coi?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by vendor registration type',
    enum: VendorRegistrationType,
  })
  @IsOptional()
  @IsEnum(VendorRegistrationType)
  vendorRegistrationType?: VendorRegistrationType;

  @ApiPropertyOptional({
    description: 'Filter by approval status for a specific client',
    enum: ['APPROVED', 'NOT_APPROVED'],
  })
  @IsOptional()
  @IsString()
  approvalStatus?: 'APPROVED' | 'NOT_APPROVED';

  @ApiPropertyOptional({
    description: 'Filter by client ID for approval status filtering',
  })
  @IsOptional()
  @IsString()
  clientId?: string;
}
