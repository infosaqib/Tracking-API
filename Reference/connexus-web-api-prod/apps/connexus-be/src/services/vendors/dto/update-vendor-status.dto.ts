import { ApiProperty } from '@nestjs/swagger';
import { VendorStatuses } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateVendorStatusDto {
  @ApiProperty({
    enum: VendorStatuses,
    description: 'New stage for the vendor',
    enumName: 'VendorStatuses',
  })
  @IsEnum(VendorStatuses)
  status: VendorStatuses;
}
