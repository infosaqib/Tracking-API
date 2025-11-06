import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantTypes } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class BranchTenantDto {
  @ApiProperty({ description: 'Branch tenant ID' })
  @IsString()
  branchTenantId: string;

  @ApiProperty({ description: 'Whether this is the primary branch' })
  @IsBoolean()
  isPrimary: boolean;
}

export class UpdateContactTypeDto {
  @ApiProperty({
    description: 'Type of entity',
    enum: TenantTypes,
    enumName: 'TenantTypes',
  })
  @IsEnum(TenantTypes)
  type: TenantTypes;

  @ApiPropertyOptional({
    description: 'Branch tenant IDs with primary indicator',
    type: [BranchTenantDto],
  })
  @ValidateIf((o) => o.type === TenantTypes.VENDOR_BRANCH)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchTenantDto)
  branchTenantIds?: BranchTenantDto[];
}
