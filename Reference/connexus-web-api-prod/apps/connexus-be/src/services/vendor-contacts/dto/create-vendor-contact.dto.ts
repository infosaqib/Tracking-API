import { ApiProperty } from '@nestjs/swagger';
import { ContactType } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';

export class CreateVendorContactDto {
  @ApiProperty({ description: 'ID of the vendor' })
  @IsUUID()
  @IsNotEmpty()
  vendorId: string;

  @ApiProperty({ description: 'First name of the property user' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name of the property user' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Email of the property user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Title of the property user' })
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty({ description: 'Phone code of the property user' })
  @IsString()
  @IsOptional()
  phoneCode: string;

  @ApiProperty({ description: 'Phone extension of the property user' })
  @IsString()
  @IsOptional()
  phoneExtension: string;

  @ApiProperty({ description: 'Phone of the property user' })
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @ApiProperty({
    description: 'Contact type of the property user',
    enum: ContactType,
    enumName: 'ContactType',
  })
  @IsEnum(ContactType)
  @IsOptional()
  contactType: ContactType;

  @ApiProperty()
  @IsBoolean()
  @TransformBoolean()
  @IsOptional()
  authorized: boolean;

  @ApiProperty()
  @ValidateIf((o: CreateVendorContactDto) => o.authorized === true)
  @IsArray()
  @ArrayMinSize(1)
  userRoles: string[];
}
