import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ContactType,
  TenantTypes,
  VendorCompanyType,
  VendorStatuses,
  VendorUnionTypes,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';
import { ServiceableAreaDto } from './update-vendor-service-area';

export class VendorContactDto {
  @ApiProperty({
    enum: ContactType,
    description: 'Type of contact - Primary or Secondary',
    enumName: 'ContactType',
  })
  @IsNotEmpty()
  @IsEnum(ContactType)
  contactType: ContactType;

  @ApiProperty({
    description: 'First name of the contact',
  })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the contact',
  })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Title/Position of the contact',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  title?: string;

  @ApiProperty({
    description: 'Email address of the contact',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Phone number of the contact',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Phone code of the contact',
  })
  @IsOptional()
  @IsString()
  phoneCode?: string;

  @ApiPropertyOptional({
    description: 'Phone extension of the contact',
  })
  @IsOptional()
  @IsString()
  phoneExtension?: string;
}

export enum VendorTypes {
  BRANCH = 'VENDOR_BRANCH',
  FRANCHISE = 'VENDOR_FRANCHISE',
  VENDOR = 'VENDOR',
}

export class CreateVendorDto {
  // Company Details
  @ApiPropertyOptional({
    description: 'ID of the parent company',
  })
  @IsOptional()
  @IsUUID()
  parentCompanyId?: string;

  @ApiPropertyOptional({
    description:
      'Type of the vendor. If parentCompanyId is present, type must be FRANCHISE or BRANCH; otherwise, it can only be VENDOR.',
    enum: VendorTypes,
    enumName: 'VendorTypes',
  })
  @IsEnum(VendorTypes)
  @IsNotEmpty()
  type?: TenantTypes;

  @ApiProperty({
    description: 'Name of the vendor company',
  })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({
    description: 'Legal name of the vendor',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim() || null)
  legalName: string;

  @ApiPropertyOptional({
    description: 'URL of the company logo',
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Company type of the vendor',
    enum: VendorCompanyType,
    enumName: 'VendorCompanyType',
  })
  @IsEnum(VendorCompanyType)
  @IsOptional()
  companyType?: VendorCompanyType;

  @ApiProperty({
    description: 'List of services provided by the vendor',
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  services: string[];

  // @ApiProperty({
  //   description: 'Status of the vendor',
  //   enum: VendorStatuses,
  // })
  // @IsEnum(VendorStatuses)
  // status: VendorStatuses;

  @ApiPropertyOptional({
    description: 'List of lead sources',
  })
  @IsOptional()
  @IsString()
  leadSources?: string;

  @ApiPropertyOptional({
    description: 'Website URL of the vendor',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Union affiliation',
    enumName: 'VendorUnionTypes',
    enum: VendorUnionTypes,
  })
  @IsOptional()
  @IsEnum(VendorUnionTypes)
  union?: VendorUnionTypes;

  @ApiPropertyOptional({
    description: 'Additional services offered',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalServices?: string[];

  @ApiPropertyOptional({
    description: 'Recognitions, licenses, and affiliations',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  recognitionsAndLicenses?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  // Location Details
  @ApiProperty({
    description: 'Street address',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'City',
  })
  @IsNotEmpty()
  @IsString()
  cityId: string;

  @ApiProperty({
    description: 'State',
  })
  @IsNotEmpty()
  @IsString()
  stateId: string;

  @ApiProperty({
    description: 'County',
  })
  @IsNotEmpty()
  @IsString()
  countyId: string;

  @ApiProperty({
    description: 'Country',
  })
  @IsNotEmpty()
  @IsString()
  countryId: string;

  @ApiProperty({
    description: 'ZIP code',
  })
  @IsNotEmpty()
  @IsString()
  zip: string;

  //  Contact Details
  @ApiProperty({
    description: 'List of vendor contacts',
    type: [VendorContactDto],
  })
  @ValidateNested({ each: true })
  @Type(() => VendorContactDto)
  @IsNotEmpty()
  contacts: VendorContactDto[];

  @ApiPropertyOptional({
    description: 'Whether vendor covers continental US',
  })
  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  vendorServiceCoverContinentalUs?: boolean;

  @ApiPropertyOptional({
    description: 'Insurance note',
  })
  @IsOptional()
  @IsString()
  vendorInsuranceNote?: string;

  @ApiPropertyOptional({
    description: 'Insurance certificate',
  })
  @IsOptional()
  @IsString()
  vendorInsuranceCertificate?: string;

  @ApiPropertyOptional({
    description: 'Insurance expiry date',
  })
  @IsOptional()
  @IsDateString()
  vendorInsuranceExpiry?: Date;

  @ApiPropertyOptional({
    description: 'List of serviceable areas',
    type: [ServiceableAreaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateIf((o) => o.vendorServiceCoverContinentalUs === false)
  serviceableAreas?: ServiceableAreaDto[];

  @ApiPropertyOptional({
    enum: VendorStatuses,
    description: 'New status for the vendor',
    enumName: 'VendorStatuses',
  })
  @IsEnum(VendorStatuses)
  @IsOptional()
  status?: VendorStatuses;
}
