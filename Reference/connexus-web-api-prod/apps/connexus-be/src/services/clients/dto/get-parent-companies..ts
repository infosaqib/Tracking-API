import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetParentCompaniesDto extends PaginationInput {
  @ApiPropertyOptional({
    description: 'Search string for client name or legal name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
