import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory, ServiceStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BulkUpdateServiceItemDto {
  @ApiProperty({ description: 'Service ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Service name', required: false })
  @IsString()
  @IsOptional()
  servicesName?: string;

  @ApiProperty({ description: 'Service description', required: false })
  @IsString()
  @IsOptional()
  serviceDescription?: string;

  @ApiProperty({
    description: 'Service category',
    required: false,
    enum: ServiceCategory,
  })
  @IsEnum(ServiceCategory)
  @IsOptional()
  category?: ServiceCategory;

  @ApiProperty({
    description: 'Service status',
    required: false,
    enum: ServiceStatus,
  })
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;
}

export class BulkUpdateServicesDto {
  @ApiProperty({
    description: 'Array of services to update',
    type: [BulkUpdateServiceItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateServiceItemDto)
  services: BulkUpdateServiceItemDto[];
}
