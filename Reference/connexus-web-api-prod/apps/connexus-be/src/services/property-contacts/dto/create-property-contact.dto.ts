import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { ConnectOrCreateUserDto } from 'src/types/property-types';

export class CreatePropertyContactDto extends ConnectOrCreateUserDto {
  @ApiProperty({ description: 'ID of the property' })
  @IsUUID()
  @IsNotEmpty()
  propertyId: string;
}
