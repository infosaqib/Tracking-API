import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdatePropertyContactDto {
  @ApiPropertyOptional({ description: 'First name of the property user' })
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiPropertyOptional({ description: 'Last name of the property user' })
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiPropertyOptional({ description: 'Email of the property user' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({ description: 'Title of the property user' })
  @IsString()
  @IsOptional()
  title: string;

  @ApiPropertyOptional({ description: 'Phone code of the property user' })
  @IsString()
  @IsOptional()
  phoneCode: string;

  @ApiPropertyOptional({ description: 'Phone extension of the property user' })
  @IsString()
  @IsOptional()
  phoneExtension: string;

  @ApiPropertyOptional({ description: 'Phone of the property user' })
  @IsString()
  @IsOptional()
  phoneNumber: string;
}
