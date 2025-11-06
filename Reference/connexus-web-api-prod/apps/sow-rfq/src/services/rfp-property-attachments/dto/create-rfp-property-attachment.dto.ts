import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRfpPropertyAttachmentDto {
  @ApiProperty({
    description: 'The name of the file',
    example: 'example.pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'The ID of the property',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({
    description: 'The ID of the RFP',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  rfpId: string;

  @ApiProperty({
    description: 'The path of the file',
    example: 'https://example.com/example.pdf',
  })
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty({
    description:
      'SHA256 or similar hash of the file contents (used for duplicate detection)',
    example: '3a7bd3e2360a3d80a5c5b1f6c3f8a7c2b4d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
    required: false,
  })
  @IsString()
  @IsOptional()
  fileHash?: string;

  @ApiProperty({
    description: 'The type of the file',
    example: 'application/pdf',
  })
  @IsString()
  @IsOptional()
  fileType?: string;

  @ApiProperty({
    description: 'The size of the file in bytes',
    example: 1024,
  })
  @IsNumber()
  @IsOptional()
  fileSizeBytes?: number;

  @ApiProperty({
    description: 'The ID of the scope of work',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  scopeOfWorkId?: string;
}
