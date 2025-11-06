import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVendorDraftDto {
  @ApiProperty({
    description: 'Name of the vendor',
    example: 'Acme Corporation',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'ID of the client creating the vendor draft',
    example: 'b7e6c2a1-1234-4f56-9abc-1234567890ab',
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;
}
