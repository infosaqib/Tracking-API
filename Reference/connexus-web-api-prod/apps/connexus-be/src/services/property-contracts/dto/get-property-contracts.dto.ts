import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class GetPropertyContractsDto extends PaginationInput {
  @ApiPropertyOptional({
    description: 'Filter by contract ID',
  })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiPropertyOptional({
    description: 'Filter by property ID',
  })
  @IsOptional()
  @IsUUID()
  propertyId?: string;
}
