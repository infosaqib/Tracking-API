import { ApiProperty } from '@nestjs/swagger';
import {
  ContractExecutionTypes,
  ContractTypes,
  EndTermTerminationTypes,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateContractServiceDto {
  @ApiProperty({
    description: 'Service ID to be linked with the contract',
  })
  @IsString()
  serviceId: string;
}

export class CreatePropertyContractDto {
  @ApiProperty({
    description: 'Property ID to be linked with the contract',
  })
  @IsString()
  propertyId: string;
}

export class CreateContractDto {
  @ApiProperty({
    description: 'Type of the contract',
    enum: ContractTypes,
  })
  @IsEnum(ContractTypes)
  contractType: ContractTypes;

  @ApiProperty({
    description: 'Start date of the contract',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  contractStartDate: Date;

  @ApiProperty({
    description: 'End date of the contract',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  contractEndDate: Date;

  @ApiProperty({
    description: 'Contract execution type',
    enum: ContractExecutionTypes,
    required: false,
  })
  @IsOptional()
  @IsEnum(ContractExecutionTypes)
  contractExecution?: ContractExecutionTypes;

  @ApiProperty({
    description: 'Cost per unit in the contract',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  costPerUnit?: number;

  @ApiProperty({
    description: 'Annual contract value',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  annualContractValue?: number;

  @ApiProperty({
    description: 'Total term of the contract',
    required: false,
  })
  @IsOptional()
  @IsString()
  contractTotalTerm?: string;

  @ApiProperty({
    description: 'End term termination type',
    enum: EndTermTerminationTypes,
  })
  @IsEnum(EndTermTerminationTypes)
  endTermTermination: EndTermTerminationTypes;

  @ApiProperty({
    description: 'Early termination fee',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  earlyTerminationFee?: number;

  @ApiProperty({
    description: 'Early termination requirements',
    required: false,
  })
  @IsOptional()
  @IsString()
  earlyTerminationRequirements?: string;

  @ApiProperty({
    description: 'Notice requirements',
    required: false,
  })
  @IsOptional()
  @IsString()
  noticeRequirements?: string;

  @ApiProperty({
    description: 'Renewal terms',
    required: false,
  })
  @IsOptional()
  @IsString()
  renewalTerms?: string;

  @ApiProperty({
    description: 'Notes or additional information about the contract',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Renewal duration of the contract',
    required: false,
  })
  @IsOptional()
  @IsString()
  renewalDuration?: string;

  @ApiProperty({
    description:
      'Array of services to be linked with the contract. Send empty array [] if no services to link.',
    type: [CreateContractServiceDto],
    example: [{ serviceId: 'uuid-here' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContractServiceDto)
  contractServices: CreateContractServiceDto[];

  @ApiProperty({
    description:
      'Array of properties to be linked with the contract. Send empty array [] if no properties to link.',
    type: [CreatePropertyContractDto],
    example: [{ propertyId: 'uuid-here' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePropertyContractDto)
  propertyContracts: CreatePropertyContractDto[];

  @ApiProperty({
    description: 'The tenant ID for the background job',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @ApiProperty({
    description: 'The vendor ID for the contract',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  vendorId: string;

  @ApiProperty({
    description: 'The response of the background job',
    required: false,
  })
  @IsOptional()
  @IsString()
  response: string;

  @ApiProperty({
    description: 'Associated uploaded file name',
    required: false,
  })
  @IsOptional()
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'Associated uploaded file hash',
    required: false,
  })
  @IsOptional()
  @IsString()
  fileHash: string;
}
