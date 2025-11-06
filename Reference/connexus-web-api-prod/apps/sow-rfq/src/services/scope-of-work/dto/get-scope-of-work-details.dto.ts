import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class GetScopeOfWorkDetailsDto {
  @ApiPropertyOptional({
    description: 'Filter by property IDs',
    type: [String],
    name: 'propertyIds[]',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  propertyIds?: string[];
}
