import { TransformArray } from '@app/shared/decorators';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { RfpPortfolioType, RfpStatusType, SowThemeTypes } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class GetRfpDto extends PaginationDto {
  @ApiProperty({
    description: 'Search by RFP name, client name, or service name',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Search by RFP name only',
    required: false,
  })
  @IsOptional()
  @IsString()
  rfpName?: string;

  @ApiProperty({
    description: 'Filter by specific RFP IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  rfpIds?: string[];

  @ApiProperty({
    description: 'Filter by client IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  clientId?: string[];

  @ApiProperty({
    description: 'Filter by service IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  serviceId?: string[];

  @ApiProperty({
    description: 'Filter by RFP status',
    required: false,
    enum: RfpStatusType,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(RfpStatusType, { each: true })
  @IsArray()
  @TransformArray()
  status?: RfpStatusType[];

  @ApiProperty({
    description: 'Filter by portfolio type',
    required: false,
    enum: RfpPortfolioType,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(RfpPortfolioType, { each: true })
  @IsArray()
  @TransformArray()
  portfolioType?: RfpPortfolioType[];

  @ApiProperty({
    description: 'Filter by theme type',
    required: false,
    enum: SowThemeTypes,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(SowThemeTypes, { each: true })
  @IsArray()
  @TransformArray()
  themeType?: SowThemeTypes[];

  @ApiProperty({
    description: 'Filter by property IDs',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsUUID('all', { each: true })
  @IsArray()
  @TransformArray()
  propertyIds?: string[];

  @ApiProperty({
    description: 'RFP due date from',
    required: false,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  rfpDueDateFrom?: string;

  @ApiProperty({
    description: 'RFP due date to',
    required: false,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  rfpDueDateTo?: string;

  @ApiProperty({
    description: 'RFP award date from',
    required: false,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  rfpAwardDateFrom?: string;

  @ApiProperty({
    description: 'RFP award date to',
    required: false,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  rfpAwardDateTo?: string;

  @ApiProperty({
    description: 'RFQ date from',
    required: false,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  rfqDateFrom?: string;

  @ApiProperty({
    description: 'RFQ date to',
    required: false,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  rfqDateTo?: string;
}
