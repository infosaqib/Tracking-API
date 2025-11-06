import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

enum PropertySelectionType {
  ALL = 'all',
  SPECIFIC = 'specific',
}

export class CreateClientScopeOfWorkFromMarkdownDto {
  @ApiProperty({ description: 'The name of the scope of work' })
  @IsString()
  @IsNotEmpty()
  scopeName: string;

  @ApiProperty({
    description: 'ID of the service related to this scope of work',
  })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({
    description: 'ID of the client related to this scope of work',
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'The markdown content for the scope of work',
  })
  @IsString()
  @IsNotEmpty()
  markdownContent: string;

  @ApiProperty({
    description:
      'Property selection type - "all" for all client properties or "specific" for selected properties',
    enum: PropertySelectionType,
  })
  @IsEnum(PropertySelectionType)
  propertySelectionType: PropertySelectionType;

  @ApiPropertyOptional({
    description:
      'Array of property IDs (required if propertySelectionType is "specific")',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ValidateIf(
    (obj) => obj.propertySelectionType === PropertySelectionType.SPECIFIC,
  )
  @IsNotEmpty()
  propertyIds?: string[];
}
