import { ApiProperty } from '@nestjs/swagger';
import { ContactType } from '@prisma/client';
import { IsEnum, IsString, IsUUID } from 'class-validator';

export class UpdateContactTypeDto {
  @ApiProperty({
    description: 'The tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsString()
  tenantId: string;

  @ApiProperty({
    enum: ContactType,
    type: ContactType,
    description: 'The contact type to set for the user',
    example: ContactType.PRIMARY_CONTACT,
  })
  @IsEnum(ContactType)
  contactType: ContactType;
}
