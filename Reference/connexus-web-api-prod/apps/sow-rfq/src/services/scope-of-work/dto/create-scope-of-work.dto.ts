import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScopeOfWorkTypes } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateScopeOfWorkDto {
  @ApiProperty({ description: 'The name of the scope of work', maxLength: 250 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  scopeName: string;

  @ApiProperty({
    description: 'The type of scope of work',
    enum: ScopeOfWorkTypes,
    default: ScopeOfWorkTypes.BASE_SCOPE_LIBRARY,
  })
  @IsEnum(ScopeOfWorkTypes)
  scopeType: ScopeOfWorkTypes = ScopeOfWorkTypes.BASE_SCOPE_LIBRARY;

  @ApiPropertyOptional({
    description: 'ID of the service related to this scope of work',
  })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'ID of the client related to this scope of work',
  })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'URL of the file attached to this scope of work',
  })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'The name of the file attached to this scope of work',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;
}
