import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePropertyContractServiceDto {
  @ApiProperty({
    description: 'ID of the contract',
  })
  @IsNotEmpty()
  @IsUUID()
  contractId: string;

  @ApiPropertyOptional({
    description: 'ID of the service',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({
    description: 'ID of the property contract',
  })
  @IsNotEmpty()
  @IsUUID()
  propertyContractId: string;

  @ApiPropertyOptional({
    description: 'Name of the extracted service',
  })
  @IsOptional()
  @IsString()
  extractedServiceName?: string;
}
