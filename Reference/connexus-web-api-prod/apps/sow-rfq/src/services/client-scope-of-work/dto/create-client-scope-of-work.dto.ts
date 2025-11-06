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

export class CreateClientScopeOfWorkDto {
  @ApiProperty({ description: 'The name of the scope of work' })
  @IsString()
  @IsNotEmpty()
  scopeName: string;

  @ApiProperty({
    description: 'Description of the scope of work',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

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
    description: 'URL of the file attached to this scope of work',
    required: false,
  })
  @IsString()
  @ValidateIf((obj) => !obj.sourceId)
  @IsNotEmpty()
  fileUrl?: string;

  @ApiProperty({
    description: 'The name of the file attached to this scope of work',
    required: false,
  })
  @IsString()
  @ValidateIf((obj) => !obj.sourceId)
  @IsNotEmpty()
  fileName?: string;

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

  @ApiPropertyOptional({
    description:
      'ID of the source scope to copy from (must be BASE_SCOPE_LIBRARY or CLIENT_SCOPE_LIBRARY). Provide either this or fileName+fileUrl, not both.',
  })
  @IsString()
  @IsOptional()
  sourceId?: string;
}
