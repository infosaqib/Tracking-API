import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdatePropertyContractServiceDto {
  @ApiPropertyOptional({
    description: 'ID of the service',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;
}
