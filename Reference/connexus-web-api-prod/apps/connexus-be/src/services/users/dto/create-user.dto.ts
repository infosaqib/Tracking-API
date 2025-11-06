import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';

export class CreateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tenantsId: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phoneCode: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phoneExtension: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsBoolean()
  @TransformBoolean()
  authorized: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty()
  @ValidateIf((o: CreateUserDto) => o.authorized === true)
  @IsArray()
  @ArrayMinSize(1)
  userRoles: string[];

  @ApiProperty({
    enum: ContactType,
  })
  @IsEnum(ContactType)
  @IsOptional()
  contactType?: ContactType;
}
