import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory, ServiceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateServiceDto {
  @ApiProperty({
    required: false,
    description: 'Name of the service',
    example: 'New Service',
  })
  @IsString()
  @IsOptional()
  servicesName?: string;

  @ApiProperty({
    required: false,
    description: 'Description of the service',
    example: 'This is a new service',
  })
  @IsString()
  @IsOptional()
  serviceDescription?: string;

  @ApiProperty({
    required: false,
    description: 'Service category id of the service',
    example: '123',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    enum: ServiceStatus,
    required: false,
    description: 'Status of the service',
    example: ServiceStatus.ACTIVE,
    enumName: 'ServiceStatus',
  })
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;

  @ApiProperty({
    enum: ServiceCategory,
    required: false,
    description: 'Category of the service',
    example: ServiceCategory.OPEX,
    enumName: 'ServiceCategory',
  })
  @IsEnum(ServiceCategory)
  @IsOptional()
  category?: ServiceCategory;
}
