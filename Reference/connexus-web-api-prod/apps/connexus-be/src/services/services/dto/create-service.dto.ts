import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ description: 'Name of the service' })
  @IsString()
  servicesName: string;

  @ApiProperty({
    description: 'Optional description of the service',
    required: false,
  })
  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @ApiProperty({
    description: 'Service category id of the service',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    description: 'Category of the service',
    enum: ServiceCategory,
    default: ServiceCategory.OPEX,
    required: false,
  })
  @IsEnum(ServiceCategory)
  @IsOptional()
  category?: ServiceCategory;

  @ApiProperty({
    description: 'ID of the parent service, if this is a sub-service',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentServiceId?: string;
}
