import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';
import { CreateVendorBranchContactDto } from './create-vendor-branch-contact.dto';

export class UpdateVendorBranchesDto {
  @ApiProperty({ description: 'ID of the vendor branch' })
  @IsUUID()
  @IsNotEmpty()
  branchTenantId: string;

  @ApiProperty()
  @IsBoolean()
  @TransformBoolean()
  isPrimaryTenant: boolean;
}

export class UpdateVendorBranchContactDto extends PartialType(
  CreateVendorBranchContactDto,
) {
  @ApiProperty({
    description: 'Vendor branches',
    isArray: true,
    type: UpdateVendorBranchesDto,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateVendorBranchesDto)
  branches: UpdateVendorBranchesDto[];
}
