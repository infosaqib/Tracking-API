import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePropertyServiceDto {
  @ApiProperty({ description: 'The ID of the property' })
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({
    description: 'An array of service IDs to associate with the property',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  serviceIds: string[];
}
