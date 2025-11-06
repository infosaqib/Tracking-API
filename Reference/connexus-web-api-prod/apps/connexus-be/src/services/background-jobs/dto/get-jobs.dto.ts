import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BackgroundJobStatuses, JobTypes } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class GetJobsDto extends PaginationDto {
  @ApiProperty({
    description: 'Search with filename',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'The tenant IDs to filter jobs',
    name: 'tenantIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tenantIds?: string[];

  @ApiProperty({
    description: 'The statuses to filter jobs',
    type: [String],
    enum: Object.values(BackgroundJobStatuses),
    isArray: true,
    example: [BackgroundJobStatuses.PENDING, BackgroundJobStatuses.COMPLETED],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(BackgroundJobStatuses, { each: true })
  status?: BackgroundJobStatuses[];

  @ApiProperty({
    description: 'The job types to filter jobs',
    type: [String],
    enum: Object.values(JobTypes),
    isArray: true,
    example: [
      JobTypes.ZIP_EXTRACTION_PROCESSING,
      JobTypes.AI_CONTRACT_PROCESSING,
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(JobTypes, { each: true })
  jobTypes?: JobTypes[];

  @ApiPropertyOptional({
    description: 'The user IDs who uploaded the jobs',
    name: 'uploadedBy[]',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  uploadedBy?: string[];

  @ApiPropertyOptional({
    description: 'Created at timestamp in ISO format',
    type: String,
    example: '2025-05-28T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  createdAt?: string;
}
