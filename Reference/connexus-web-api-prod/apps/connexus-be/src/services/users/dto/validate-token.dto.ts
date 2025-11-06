import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ValidateTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  token: string;
}
