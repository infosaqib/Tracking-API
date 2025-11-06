import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '@prisma/client';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCorporateContactDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phoneCode: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phoneExtension: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiPropertyOptional({ description: 'Email of the corporate contact' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({
    enum: [
      ContactType.PRIMARY_CONTACT,
      ContactType.SECONDARY_CONTACT,
      ContactType.ON_SITE_TEAM_USER,
      null,
    ],
    enumName: 'CorporateContactType',
  })
  @IsIn([
    ContactType.PRIMARY_CONTACT,
    ContactType.SECONDARY_CONTACT,
    ContactType.ON_SITE_TEAM_USER,
    null,
  ])
  @IsOptional()
  contactType?: ContactType | null;
}
