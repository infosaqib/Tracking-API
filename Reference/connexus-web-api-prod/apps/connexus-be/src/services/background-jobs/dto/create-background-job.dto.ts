import { ApiProperty } from '@nestjs/swagger';
import { JobTypes } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBackgroundJobDto {
  @ApiProperty({
    description: 'The tenant ID for the background job',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @ApiProperty({
    description: 'The type of background job',
    enum: JobTypes,
    example: JobTypes.ZIP_EXTRACTION_PROCESSING,
  })
  @IsNotEmpty()
  @IsEnum(JobTypes)
  jobType: JobTypes;

  @ApiProperty({
    description: 'The response of the background job',
    required: false,
  })
  @IsOptional()
  @IsString()
  response: string;

  @ApiProperty({
    description: 'Associated uploaded file name',
    required: false,
  })
  @IsOptional()
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'Associated uploaded file hash',
    required: false,
  })
  @IsOptional()
  @IsString()
  fileHash: string;
}
