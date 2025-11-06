import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractTypes } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { DateFilterType } from './date-filter-type';

export class GetContractPropertyWiseDto extends PaginationDto {
  @ApiProperty({
    description: 'Search term for property name, city name, or state name',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    enum: ContractTypes,
    description: 'Type of contract',
    required: false,
  })
  @IsOptional()
  @IsEnum(ContractTypes)
  contractType?: ContractTypes;

  @ApiPropertyOptional({
    type: [String],
    isArray: true,
    description: 'City IDs of the city',
    name: 'cityIds[]',
  })
  @IsOptional()
  @IsArray()
  // @IsUUID('4', { each: true })
  cityIds: string[];

  @ApiPropertyOptional({
    type: [String],
    isArray: true,
    description: 'State IDs of the city',
    name: 'stateIds[]',
  })
  @IsOptional()
  @IsArray()
  // @IsUUID('4', { each: true })
  stateIds: string[];

  @ApiProperty({
    description: 'Filter by contract start date (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  contractStartDate?: string;

  @ApiProperty({
    enum: DateFilterType,
    description:
      'Whether to filter contracts starting before or after the given date',
    required: false,
  })
  @IsOptional()
  @IsEnum(DateFilterType)
  contractStartDateFilter?: DateFilterType;

  @ApiProperty({
    description: 'Filter by contract end date (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  @ApiProperty({
    enum: DateFilterType,
    description:
      'Whether to filter contracts ending before or after the given date',
    required: false,
  })
  @IsOptional()
  @IsEnum(DateFilterType)
  contractEndDateFilter?: DateFilterType;

  @ApiPropertyOptional({
    type: [String],
    isArray: true,
    description: 'Client IDs to filter by',
    name: 'clientIds[]',
  })
  @IsOptional()
  @IsArray()
  clientIds: string[];

  @ApiPropertyOptional({
    type: [String],
    isArray: true,
    description: 'Property IDs to filter by',
    name: 'propertyIds[]',
  })
  @IsOptional()
  @IsArray()
  propertyIds: string[];

  @ApiPropertyOptional({
    type: [String],
    isArray: true,
    description: 'Service IDs to filter by',
    name: 'serviceIds[]',
  })
  @IsOptional()
  @IsArray()
  serviceIds: string[];

  @ApiPropertyOptional({
    type: [String],
    isArray: true,
    description: 'Vendor IDs to filter by',
    name: 'vendorIds[]',
  })
  @IsOptional()
  @IsArray()
  vendorIds: string[];

  @ApiPropertyOptional({
    description: 'Filter by annual contract value',
    type: Number,
    required: false,
  })
  @IsOptional()
  annualContractValue?: number;

  @ApiPropertyOptional({
    description: 'Filter by cost per unit',
    type: Number,
    required: false,
  })
  @IsOptional()
  costPerUnit?: number;

  @ApiPropertyOptional({
    description: 'Filter by renewal duration',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  renewalDuration?: string;

  @ApiPropertyOptional({
    description: 'Filter by contract total term',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  contractTotalTerm?: string;
}
