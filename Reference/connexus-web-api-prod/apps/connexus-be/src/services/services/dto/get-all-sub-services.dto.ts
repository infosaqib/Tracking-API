import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory, ServiceStatus } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class GetAllSubServicesDto {
  @ApiProperty({
    description: 'The category of the sub-services to get',
    required: false,
    enum: ServiceCategory,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  category?: ServiceCategory[];

  @ApiProperty({
    description: 'The category ids of the sub-services to get',
    required: false,
    name: 'categoryIds[]',
  })
  @IsOptional()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiProperty({
    description: 'The status of the sub-services to get',
    required: false,
    enum: ServiceStatus,
  })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}
