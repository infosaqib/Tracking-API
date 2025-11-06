import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetRfpPropertyAttachmentsDto {
  @ApiPropertyOptional({ description: 'Property ID to filter attachments' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'File name (partial match)' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: 'File type (e.g., application/pdf)' })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  @IsOptional()
  @IsString()
  createdById?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  @IsOptional()
  @IsString()
  updatedById?: string;

  @ApiPropertyOptional({ description: 'Created start date (ISO string)' })
  @IsOptional()
  @IsString()
  createdStartDate?: string;

  @ApiPropertyOptional({ description: 'Created end date (ISO string)' })
  @IsOptional()
  @IsString()
  createdEndDate?: string;

  @ApiPropertyOptional({ description: 'Uploaded start date (ISO string)' })
  @IsOptional()
  @IsString()
  uploadedStartDate?: string;

  @ApiPropertyOptional({ description: 'Uploaded start date (ISO string)' })
  @IsOptional()
  @IsString()
  uploadedEndDate?: string;

  @ApiPropertyOptional({ description: 'Scope of work ID' })
  @IsOptional()
  @IsString()
  scopeOfWorkId?: string;

  @ApiPropertyOptional({ description: 'RFP ID' })
  @IsOptional()
  @IsString()
  rfpId?: string;
}
