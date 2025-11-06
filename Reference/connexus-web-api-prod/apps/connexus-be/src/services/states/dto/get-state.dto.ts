import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetStateDto extends PaginationInput {
  @ApiPropertyOptional({
    description: 'Filter by country ID',
  })
  @IsString()
  @IsOptional()
  countryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stateName?: string;
}
