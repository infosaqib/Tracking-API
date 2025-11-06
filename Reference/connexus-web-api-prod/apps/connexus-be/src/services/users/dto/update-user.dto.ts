import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(50)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phoneCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phoneExtension?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @TransformBoolean()
  authorized?: boolean;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.authorized || (o.userRoles && o.userRoles.length > 0))
  @IsArray({})
  @ArrayMinSize(1)
  @IsOptional()
  userRoles?: string[];

  @ApiPropertyOptional({
    enum: ContactType,
    type: ContactType,
  })
  @IsOptional()
  @IsEnum(ContactType)
  contactType?: ContactType;
}
