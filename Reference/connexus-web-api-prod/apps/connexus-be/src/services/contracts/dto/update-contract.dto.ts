import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ContractExecutionTypes,
  ContractStatuses,
  ContractTypes,
  EndTermTerminationTypes,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { IsDateGreaterThan } from 'src/utils/date-helpers';

export class UpdateContractDto {
  @ApiPropertyOptional({
    description: 'Type of the contract',
    enum: ContractTypes,
  })
  @IsOptional()
  @IsEnum(ContractTypes)
  contractType?: ContractTypes;

  @ApiPropertyOptional({ description: 'Property Contract ID' })
  @IsOptional()
  @IsString()
  propertyContractId?: string;

  @ApiPropertyOptional({ description: 'Start date of the contract' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  contractStartDate?: Date;

  @ApiPropertyOptional({ description: 'End date of the contract' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @IsDateGreaterThan('contractStartDate', {
    message: 'Contract end date must be greater than start date',
  })
  contractEndDate?: Date;

  @ApiPropertyOptional({
    description: 'Contract execution type',
    enum: ContractExecutionTypes,
  })
  @IsOptional()
  @IsEnum(ContractExecutionTypes)
  contractExecution?: ContractExecutionTypes;

  @ApiPropertyOptional({ description: 'Cost per unit in the contract' })
  @IsOptional()
  @IsNumber()
  costPerUnit?: number;

  @ApiPropertyOptional({ description: 'Annual contract value' })
  @IsOptional()
  @IsNumber()
  annualContractValue?: number;

  @ApiPropertyOptional({ description: 'Total term of the contract' })
  @IsOptional()
  @IsString()
  contractTotalTerm?: string;

  @ApiPropertyOptional({
    description: 'End term termination type',
    enum: EndTermTerminationTypes,
  })
  @IsOptional()
  @IsEnum(EndTermTerminationTypes)
  endTermTermination?: EndTermTerminationTypes;

  @ApiPropertyOptional({ description: 'Early termination fee' })
  @IsOptional()
  @IsNumber()
  earlyTerminationFee?: number;

  @ApiPropertyOptional({ description: 'Early termination requirements' })
  @IsOptional()
  @IsString()
  @Length(0, 1000, {
    message: 'Early Termination Requirements must not exceed 1000 characters',
  })
  earlyTerminationRequirements?: string;

  @ApiPropertyOptional({ description: 'Notice requirements' })
  @IsOptional()
  @IsString()
  @Length(0, 1000, {
    message: 'Notice requirements must not exceed 1000 characters',
  })
  noticeRequirements?: string;

  @ApiPropertyOptional({ description: 'Renewal terms' })
  @IsOptional()
  @IsString()
  @Length(0, 1000, {
    message: 'Renewal terms must not exceed 1000 characters',
  })
  renewalTerms?: string;

  @ApiProperty({ required: false, description: 'ID of the vendor' })
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiProperty({
    required: false,
    description: 'New status for the contract',
    enum: ContractStatuses,
    enumName: 'ContractStatuses',
  })
  @IsEnum(ContractStatuses)
  @IsOptional()
  contractStatus?: ContractStatuses;

  @ApiPropertyOptional({ description: 'Property ID to update', type: 'string' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'Service ID to update', type: 'string' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Notes for contract', type: 'string' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Renewal duration of contract',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  renewalDuration?: string;
}
