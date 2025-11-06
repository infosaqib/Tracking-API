import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdatePropertyContractDto {
  @ApiPropertyOptional({
    description: 'ID of the property',
  })
  @IsOptional()
  @IsUUID()
  propertyId?: string;
}
