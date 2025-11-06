import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  VendorCompanyType,
  VendorOwnership,
  VendorStatuses,
  VendorUnionTypes,
} from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';

export class UpdateVendorDto {
  @ApiProperty({ required: false, description: 'Company name of the vendor' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ required: false, description: 'URL of the vendor logo' })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({
    required: false,
    description: 'Physical address of the vendor',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    required: false,
    description: 'Recognitions and certifications',
  })
  @IsString()
  @IsOptional()
  recognitionsAndLicenses?: string;

  @ApiProperty({
    required: false,
    description: 'Insurance certification details',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim() || null)
  certInsurance?: string;

  @ApiProperty({
    required: false,
    description: 'Expiration date of the insurance certification',
  })
  @IsDateString()
  @IsOptional()
  certInsuranceExpiry?: Date;

  @ApiProperty({
    required: false,
    description: 'Additional notes about the vendor',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false, description: 'Source of the vendor lead' })
  @IsString()
  @IsOptional()
  leadSources?: string;

  @ApiProperty({
    required: false,
    description: 'Legal registered name of the vendor',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim() || null)
  legalName?: string;

  @ApiProperty({ required: false, description: 'URL to W9 form document' })
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim() || null)
  vendorW9Url?: string;

  @ApiProperty({
    required: false,
    description: 'Ownership details of the vendor',
    enum: VendorOwnership,
    isArray: true,
    enumName: 'VendorOwnership',
  })
  @IsEnum(VendorOwnership, { each: true })
  @IsArray()
  @IsOptional()
  vendorOwnership?: VendorOwnership[];

  @ApiProperty({
    required: false,
    description: 'Years of experience in the industry',
  })
  @IsInt()
  @IsOptional()
  vendorExperience?: number;

  @ApiProperty({
    required: false,
    description: 'Social security number of the vendor',
  })
  @IsString()
  @IsOptional()
  vendorSocialSecurityNumber?: string;

  @ApiProperty({
    required: false,
    description: 'Interest in receiving RFPs outside their area',
  })
  @IsBoolean()
  @TransformBoolean()
  @IsOptional()
  vendorInterestedReceiveRfpOutside?: boolean;

  @ApiProperty({
    required: false,
    description: 'ZIP/Postal code of the vendor',
  })
  @IsString()
  @IsOptional()
  zip?: string;

  @ApiProperty({
    required: false,
    enum: VendorUnionTypes,
    description: 'Union status of the vendor',
  })
  @IsEnum(VendorUnionTypes)
  @IsOptional()
  union?: VendorUnionTypes;

  @ApiProperty({
    required: false,
    description: 'ID of the existing accountant associated with vendor',
  })
  @IsString()
  @IsOptional()
  @ValidateIf(
    (o: UpdateVendorDto) =>
      !o.accountantFirstName &&
      !o.accountantLastName &&
      !o.accountantEmail &&
      !o.accountantPhone,
  )
  accountantId?: string;

  @ApiProperty({
    required: false,
    description: 'Email of the new accountant',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.accountantId)
  accountantEmail?: string;

  @ApiProperty({
    required: false,
    description: 'Phone number of the new accountant',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.accountantId)
  accountantPhone?: string;

  @ApiProperty({
    required: false,
    description: 'Phone country code of the new accountant',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.accountantId)
  accountantPhoneCode?: string;

  @ApiProperty({
    required: false,
    description: 'Phone extension of the new accountant',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.accountantId)
  accountantPhoneExtension?: string;

  @ApiProperty({
    required: false,
    description: 'First name of the new accountant',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.accountantId)
  accountantFirstName?: string;

  @ApiProperty({
    required: false,
    description: 'Last name of the new accountant',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.accountantId)
  accountantLastName?: string;

  @ApiProperty({
    required: false,
    description: 'Employer Identification Number',
  })
  @IsString()
  @IsOptional()
  vendorEin?: string;

  @ApiProperty({ required: false, description: 'Website URL of the vendor' })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({
    required: false,
    description: 'ID of the city where vendor is located',
  })
  @IsString()
  @IsOptional()
  cityId?: string;

  @ApiProperty({
    required: false,
    description: 'ID of the state where vendor is located',
  })
  @IsString()
  @IsOptional()
  stateId?: string;

  @ApiProperty({
    required: false,
    description: 'ID of the county where vendor is located',
  })
  @IsString()
  @IsOptional()
  countyId?: string;

  @ApiProperty({
    required: false,
    description: 'ID of the country where vendor is located',
  })
  @IsString()
  @IsOptional()
  countryId?: string;

  @ApiProperty({
    required: false,
    description: 'Additional notes about the vendor insurance',
  })
  @IsString()
  @IsOptional()
  vendorInsuranceNote?: string;

  @ApiProperty({
    required: false,
    description: 'Expiration date of the vendor insurance',
  })
  @IsDateString()
  @IsOptional()
  vendorInsuranceExpiry?: Date;

  @ApiProperty({
    required: false,
    description: 'Certificate of the vendor insurance',
  })
  @IsString()
  @IsOptional()
  vendorInsuranceCertificate?: string;

  @ApiProperty({
    required: false,
    description: 'ID of the parent company',
  })
  @IsString()
  @IsOptional()
  parentCompanyId?: string;

  @ApiPropertyOptional({
    description: 'Additional services offered',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalServices?: string[];

  @ApiProperty({
    description: 'List of services provided by the vendor',
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  services?: string[];

  @ApiProperty({
    description: 'Status of the vendor',
    enum: VendorStatuses,
    enumName: 'VendorStatuses',
  })
  @IsEnum(VendorStatuses)
  @IsOptional()
  status: VendorStatuses;

  @ApiPropertyOptional({
    description: 'Company type of the vendor',
    enum: VendorCompanyType,
    enumName: 'VendorCompanyType',
  })
  @IsEnum(VendorCompanyType)
  @IsOptional()
  companyType?: VendorCompanyType;
}
