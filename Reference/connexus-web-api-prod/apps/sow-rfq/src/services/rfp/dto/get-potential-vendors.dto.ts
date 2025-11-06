import { TransformArray } from '@app/shared/decorators';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { VendorStatuses } from '@prisma/client';
import { IsArray, IsEnum, IsOptional } from 'class-validator';

export class GetPotentialVendorsDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by vendor status',
    required: false,
    enum: VendorStatuses,
    enumName: 'VendorStatuses',
    isArray: true,
  })
  @IsOptional()
  @IsEnum(VendorStatuses, { each: true })
  @IsArray()
  @TransformArray()
  status?: VendorStatuses[];
}
