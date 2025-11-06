import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScopeOfWorkStatuses } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateScopeOfWorkDto {
  @ApiPropertyOptional({
    description: 'The name of the scope of work',
    maxLength: 250,
  })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  scopeName?: string;

  @ApiPropertyOptional({
    description: 'The status of the scope of work',
    enum: ScopeOfWorkStatuses,
  })
  @IsEnum(ScopeOfWorkStatuses)
  @IsOptional()
  scopeOfWorkStatus?: ScopeOfWorkStatuses;

  @ApiPropertyOptional({
    description: 'The version of the scope of work',
    type: Number,
  })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'The name of the file attached to this scope of work',
  })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'ID of the service related to this scope of work',
  })
  @IsString()
  @IsOptional()
  serviceId?: string;
}
