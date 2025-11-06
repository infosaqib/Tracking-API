import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiProperty } from '@nestjs/swagger';
import { TenantTypes } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SearchTenantDto extends PaginationInput {
  @IsOptional()
  @IsEnum(TenantTypes)
  @ApiProperty({
    required: false,
    enum: TenantTypes,
    enumName: 'TenantTypes',
  })
  type?: TenantTypes;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
  })
  query?: string;
}
