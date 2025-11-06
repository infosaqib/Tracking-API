import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';
import { CreateVendorContactDto } from './create-vendor-contact.dto';

export class VendorContactBranchesDto {
  @ApiProperty({ description: 'ID of the vendor branch' })
  @IsUUID()
  @IsNotEmpty()
  branchTenantId: string;

  @ApiProperty()
  @IsBoolean()
  @TransformBoolean()
  isPrimaryTenant: boolean;
}

export class CreateVendorBranchContactDto extends OmitType(
  CreateVendorContactDto,
  ['vendorId'],
) {
  @ApiProperty({
    description: 'Vendor branches',
    isArray: true,
    type: VendorContactBranchesDto,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VendorContactBranchesDto)
  branches: VendorContactBranchesDto[];
}
