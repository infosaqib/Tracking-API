import { PaginationDto } from '@app/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for filtering properties in a scope of work
 */
export class GetScopeOfWorkPropertyDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by ScopeOfWork ID',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  scopeOfWorkId: string;

  @ApiPropertyOptional({ description: 'Filter by Client IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  clientId?: string[];

  @ApiPropertyOptional({
    description: 'Search by property name / property address',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by property IDs',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  propertyId?: string[];

  @ApiPropertyOptional({ description: 'Filter by state' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  state?: string[];

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  city?: string[];

  @ApiPropertyOptional({ description: 'Filter by county' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  county?: string[];
}
