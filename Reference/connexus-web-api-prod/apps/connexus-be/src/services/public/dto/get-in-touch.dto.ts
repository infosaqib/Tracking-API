import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { TransformNumber } from 'src/utils/transform';

export class GetInTouchDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  companyName: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phoneNumber: string;

  @ApiProperty({ required: false })
  @IsString()
  @MinLength(1)
  @MaxLength(6)
  @IsOptional()
  phoneExtension?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  state: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(10)
  zipCode: string;

  @ApiProperty()
  @IsUrl()
  @IsOptional()
  companyWebsite: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Min(1)
  @TransformNumber()
  @IsOptional()
  unitCount?: number;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  message: string;
}
