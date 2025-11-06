import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiProperty({
    description: 'Name of the service category',
    example: 'Maintenance Services',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
