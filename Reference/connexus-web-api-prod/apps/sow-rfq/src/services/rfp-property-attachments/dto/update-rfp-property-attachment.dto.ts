import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRfpPropertyAttachmentDto {
  @ApiProperty({ description: 'The name of the file', example: 'example.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'The path of the file',
    example: 'https://example.com/example.pdf',
  })
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty({
    description: 'The type of the file',
    example: 'application/pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @ApiProperty({
    description:
      'SHA256 or similar hash of the file contents (used for duplicate detection)',
    example: '3a7bd3e2360a3d80a5c5b1f6c3f8a7c2b4d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
    required: false,
  })
  @IsString()
  @IsOptional()
  fileHash?: string;
}
