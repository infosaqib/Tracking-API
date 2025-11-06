import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class GetPropertyContractServicesDto extends PaginationInput {
  @ApiPropertyOptional({
    description: 'Filter by contract ID',
  })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiPropertyOptional({
    description: 'Filter by property contract ID',
  })
  @IsOptional()
  @IsUUID()
  propertyContractId?: string;

  @ApiPropertyOptional({
    description: 'Filter by service ID',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;
}
