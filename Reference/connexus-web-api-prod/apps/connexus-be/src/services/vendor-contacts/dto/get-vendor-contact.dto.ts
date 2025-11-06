import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetVendorContactDto extends PaginationInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search: string;

  @ApiPropertyOptional({
    enum: ContactType,
    description: 'Filter contacts by their role/type',
  })
  @IsOptional()
  @IsEnum(ContactType)
  contactType: ContactType;
}
