import { ApiProperty } from '@nestjs/swagger';
import { RfpPortfolioType, RfpStatusType, SowThemeTypes } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RfpDocumentDto } from './create-rfp.dto';

export class UpdateRfpDto {
  @ApiProperty({
    description: 'Name of the RFP',
    example: 'Annual Landscaping RFP',
    required: false,
  })
  @IsString()
  @IsOptional()
  rfpName?: string;

  @ApiProperty({
    description: 'Description of the RFP',
    example: 'Annual landscaping services for all properties',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID of the client',
    example: 'c8a9d7e6-f5b4-4a3e-2b1c-9d8e7f6a5b4c',
    required: false,
  })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({
    description: 'ID of the RFP service',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    required: false,
  })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({
    enum: RfpPortfolioType,
    description: 'Portfolio type of the RFP',
    example: RfpPortfolioType.SINGLE_PROPERTY,
    required: false,
  })
  @IsEnum(RfpPortfolioType)
  @IsOptional()
  portfolioType?: RfpPortfolioType;

  @ApiProperty({
    enum: SowThemeTypes,
    description: 'Theme type for the RFP',
    example: SowThemeTypes.DEFAULT,
    required: false,
  })
  @IsEnum(SowThemeTypes)
  @IsOptional()
  themeType?: SowThemeTypes;

  @ApiProperty({
    description: 'ID of the contract',
    example: 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7',
    required: false,
  })
  @IsString()
  @IsOptional()
  contractId?: string;

  @ApiProperty({
    description: 'RFP due date',
    example: '2025-12-31T23:59:59.999Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  rfpDueDate?: Date;

  @ApiProperty({
    description: 'RFP award date',
    example: '2026-01-31T23:59:59.999Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  rfpAwardDate?: Date;

  @ApiProperty({
    description: 'RFQ date',
    example: '2025-11-30T23:59:59.999Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  rfqDate?: Date;

  @ApiProperty({
    description:
      'List of property IDs to associate with the RFP. This will replace existing properties.',
    type: [String],
    example: ['d9e8f7g6-h5i4-3j2k-1l0m-n9o8p7q6r5s4'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  propertyIds?: string[];

  @ApiProperty({
    description: 'RFI date',
    example: '2025-10-01T00:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  rfiDate?: Date;

  @ApiProperty({
    description: 'Contract start date',
    example: '2025-10-15T00:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  contractStartDate?: Date;

  @ApiProperty({
    description: 'Term of contract',
    example: '12 months',
    required: false,
  })
  @IsString()
  @IsOptional()
  termOfContract?: string;

  @ApiProperty({
    description: 'Status of the RFP',
    enum: RfpStatusType,
    required: false,
  })
  @IsEnum(RfpStatusType)
  @IsOptional()
  status?: RfpStatusType;

  @ApiProperty({
    description: 'List of scope of work IDs associated with the RFP',
    type: [String],
    example: ['e1f2g3h4-i5j6-7k8l-9m0n-o1p2q3r4s5t6'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scopeOfWorkIds?: string[];

  @ApiProperty({
    description: 'List of documents to be added to the RFP',
    type: [RfpDocumentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RfpDocumentDto)
  documentsToAdd?: RfpDocumentDto[];

  @ApiProperty({
    description: 'List of documents to be removed from the RFP',
    type: [String],
    example: [
      'd9e8f7g6-h5i4-3j2k-1l0m-n9o8p7q6r5s4',
      'e1f2g3h4-i5j6-7k8l-9m0n-o1p2q3r4s5t6',
    ],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  documentsToRemove?: string[];

  @ApiProperty({
    description: 'RFP extended due date',
    example: '2025-12-31T23:59:59.999Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  rfpExtendedDueDate?: string;
}
