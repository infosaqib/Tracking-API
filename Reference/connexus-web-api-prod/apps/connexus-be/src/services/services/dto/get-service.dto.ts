import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory, ServiceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetServicesDto extends PaginationInput {
  @ApiPropertyOptional({
    description: 'Search services by name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter services by status',
  })
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;

  @ApiPropertyOptional({
    description: 'Filter services by categories',
    enum: ServiceCategory,
    isArray: true,
    name: 'category[]',
  })
  @IsEnum(ServiceCategory, { each: true })
  @IsOptional()
  category?: ServiceCategory[];

  @ApiPropertyOptional({
    description: 'Filter services by approved by',
    name: 'approvedBy[]',
  })
  @IsString({ each: true })
  @IsOptional()
  approvedBy?: string[];

  @ApiPropertyOptional({
    description: 'Filter services by service category id',
    name: 'categoryIds[]',
  })
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter services by sub service id',
    name: 'subServiceId[]',
  })
  @IsString({ each: true })
  @IsOptional()
  subServiceId?: string[];

  @ApiPropertyOptional({
    description: 'Filter services by service approved on date',
  })
  @IsString()
  @IsOptional()
  serviceApprovedOn?: string;

  @ApiPropertyOptional({
    description: 'Filter services by created on date',
  })
  @IsString()
  @IsOptional()
  createdAt?: string;
}
