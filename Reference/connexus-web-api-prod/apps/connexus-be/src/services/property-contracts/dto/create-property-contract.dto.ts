import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePropertyContractDto {
  @ApiProperty({
    description: 'ID of the contract',
  })
  @IsNotEmpty()
  @IsUUID()
  contractId: string;

  @ApiProperty({
    description: 'ID of the property',
  })
  @IsNotEmpty()
  @IsUUID()
  propertyId: string;
}
