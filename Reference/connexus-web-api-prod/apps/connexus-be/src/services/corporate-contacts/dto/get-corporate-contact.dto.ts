import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetCorporateContactDto extends PaginationInput {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ContactType)
  contactType?: ContactType;
}
