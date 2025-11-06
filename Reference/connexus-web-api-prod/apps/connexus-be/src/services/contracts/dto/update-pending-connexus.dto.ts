import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ContractExecutionTypes,
  ContractStatuses,
  ContractTypes,
  EndTermTerminationTypes,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { IsDateGreaterThan } from 'src/utils/date-helpers';

export class AddPropertyContractDto {
  @ApiProperty({
    description: 'Property ID to be linked with the contract',
  })
  @IsString()
  propertyId: string;
}

export class AddContractServiceDto {
  @ApiProperty({
    description: 'Service ID to be linked with the contract',
  })
  @IsString()
  serviceId: string;
}

export class UpdatePendingConnexusDto {
  @ApiPropertyOptional({
    description: 'Background Job ID to be linked with the contract',
  })
  @IsString()
  @IsOptional()
  backgroundJobId?: string;

  @ApiPropertyOptional({
    description: 'Type of the contract',
    enum: ContractTypes,
  })
  @IsOptional()
  @IsEnum(ContractTypes)
  contractType?: ContractTypes;

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

  @ApiPropertyOptional({
    description: 'Array of new properties to be linked with the contract',
    type: [AddPropertyContractDto],
    example: [{ propertyId: 'uuid-here' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddPropertyContractDto)
  newPropertyContracts?: AddPropertyContractDto[];

  @ApiPropertyOptional({
    description: 'Array of new services to be linked with property contracts',
    type: [AddContractServiceDto],
    example: [{ serviceId: 'uuid-here' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddContractServiceDto)
  newContractServices?: AddContractServiceDto[];
}
