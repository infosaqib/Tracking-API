import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateVendorContactDto {
  @ApiPropertyOptional({ description: 'First name of the vendor contact' })
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiPropertyOptional({ description: 'Last name of the vendor contact' })
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiPropertyOptional({ description: 'Email of the vendor contact' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({ description: 'Title of the vendor contact' })
  @IsString()
  @IsOptional()
  title: string;

  @ApiPropertyOptional({ description: 'Phone code of the vendor contact' })
  @IsString()
  @IsOptional()
  phoneCode: string;

  @ApiPropertyOptional({ description: 'Phone extension of the vendor contact' })
  @IsString()
  @IsOptional()
  phoneExtension: string;

  @ApiPropertyOptional({ description: 'Phone number of the vendor contact' })
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Contact type of the vendor contact',
    enum: ContactType,
    enumName: 'ContactType',
  })
  @IsEnum(ContactType)
  @IsOptional()
  contactType: ContactType;

  @ApiPropertyOptional({ description: 'Vendor ID of the vendor contact' })
  @IsString()
  @IsOptional()
  vendorId: string;
}
