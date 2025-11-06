import { PaginationDto, SortDirection } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class GetScopeOfWorkPropertyVersionDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by ScopeOfWorkProperty ID' })
  @IsString()
  @IsOptional()
  scopeOfWorkPropertyId?: string;

  @ApiPropertyOptional({ description: 'Filter by ScopeOfWorkVersion ID' })
  @IsString()
  @IsOptional()
  scopeOfWorkVersionId?: string;

  @ApiPropertyOptional({ description: 'Search by property name' })
  @IsString()
  @IsOptional()
  propertyName?: string;

  @ApiPropertyOptional({
    description: 'Search by property name, file name, or created user name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by created start date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  createdStartDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by created end date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  createdEndDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by updated start date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  updatedStartDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by updated end date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  updatedEndDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by uploaded start date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  uploadedStartDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by uploaded end date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  uploadedEndDate?: string;

  @ApiPropertyOptional({
    description: 'The direction of the sort',
    default: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: SortDirection = SortDirection.DESC;
}
