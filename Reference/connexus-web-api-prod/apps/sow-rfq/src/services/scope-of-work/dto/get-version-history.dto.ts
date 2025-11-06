import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScopeOfWorkVersionStatuses } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';

export class GetVersionHistoryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by scope of work ID',
  })
  @IsString()
  @IsNotEmpty()
  scopeOfWorkId: string;

  @ApiPropertyOptional({
    description: 'Filter by version status',
    enum: ScopeOfWorkVersionStatuses,
    name: 'status[]',
    type: [String],
    isArray: true,
  })
  @IsEnum(ScopeOfWorkVersionStatuses, { each: true })
  @IsOptional()
  status?: ScopeOfWorkVersionStatuses[];

  @ApiPropertyOptional({
    description: 'Filter by file name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by creator ID',
  })
  @IsUUID()
  @IsOptional()
  createdById?: string;

  @ApiPropertyOptional({
    description: 'Filter by created start date (ISO 8601)',
  })
  @IsString()
  @IsOptional()
  createdStartDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by created end date (ISO 8601)',
  })
  @IsString()
  @IsOptional()
  createdEndDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by updated start date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  updatedStartDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by updated end date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  updatedEndDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by uploaded start date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  uploadedStartDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by uploaded end date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  uploadedEndDate?: string;

  @ApiPropertyOptional({
    description: 'Include only current versions',
  })
  @IsBoolean()
  @IsOptional()
  @TransformBoolean()
  isCurrentOnly?: boolean;
}
