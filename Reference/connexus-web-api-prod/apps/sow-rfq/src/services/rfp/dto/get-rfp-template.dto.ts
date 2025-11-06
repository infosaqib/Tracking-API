import { ApiProperty } from '@nestjs/swagger';
import { TemplateFileTypes } from '@prisma/client';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetRfpTemplateDto {
  @ApiProperty({
    description: 'The file type of the template',
    example: 'DOCX',
    enum: TemplateFileTypes,
  })
  @IsNotEmpty()
  @IsString()
  fileType: TemplateFileTypes;

  @ApiProperty({
    description: 'The ID of the RFP',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  rfpId: string;

  @ApiProperty({
    description:
      'Force regeneration of template even if a valid completed task exists',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  forceRegeneration?: boolean;
}
