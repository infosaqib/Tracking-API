import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiProperty } from '@nestjs/swagger';
import { TenantTypes } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class GetRolesDto extends PaginationInput {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  tenantId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    required: false,
    isArray: true,
    type: String,
    name: 'tenantIds[]',
  })
  tenantIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    required: false,
    isArray: true,
    type: String,
    name: 'parentTenantIds[]',
  })
  parentTenantIds?: string[];

  @IsArray()
  @IsEnum(TenantTypes, { each: true })
  @IsOptional()
  @ApiProperty({
    required: false,
    isArray: true,
    enum: TenantTypes,
    name: 'tenantTypes[]',
  })
  tenantTypes?: TenantTypes[];
}
