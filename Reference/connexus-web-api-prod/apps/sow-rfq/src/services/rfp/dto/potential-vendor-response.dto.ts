import { ApiProperty } from '@nestjs/swagger';
import {
  VendorServiceType,
  VendorStages,
  VendorStatuses,
} from '@prisma/client';

export enum VendorMatchType {
  CONTINENTAL_US_COVERAGE = 'CONTINENTAL_US_COVERAGE',
  OUTSIDE_RFP_INTEREST = 'OUTSIDE_RFP_INTEREST',
  STATE_WIDE_COVERAGE = 'STATE_WIDE_COVERAGE',
  CITY_COVERAGE = 'CITY_COVERAGE',
  COUNTY_COVERAGE = 'COUNTY_COVERAGE',
  SPECIFIC_LOCATION = 'SPECIFIC_LOCATION',
}

export class ServiceableAreaDto {
  @ApiProperty({ description: 'Serviceable area ID' })
  id: string;

  @ApiProperty({ description: 'State ID' })
  stateId: string;

  @ApiProperty({ description: 'City ID', required: false })
  cityId?: string;

  @ApiProperty({ description: 'County ID', required: false })
  countyId?: string;
}

export class CityDto {
  @ApiProperty({ description: 'City ID' })
  id: string;

  @ApiProperty({ description: 'City name' })
  cityName: string;
}

export class StateDto {
  @ApiProperty({ description: 'State ID' })
  id: string;

  @ApiProperty({ description: 'State name' })
  stateName: string;
}

export class CountryDto {
  @ApiProperty({ description: 'Country ID' })
  id: string;

  @ApiProperty({ description: 'Country name' })
  countryName: string;
}

export class ParentCompanyDto {
  @ApiProperty({ description: 'Parent company ID' })
  id: string;

  @ApiProperty({ description: 'Parent company name' })
  name: string;
}

export class ParentTenantDto {
  @ApiProperty({ description: 'Parent tenant ID' })
  id: string;

  @ApiProperty({ description: 'Parent tenant name' })
  name: string;
}

export class TenantDto {
  @ApiProperty({ description: 'Tenant ID' })
  id: string;

  @ApiProperty({ description: 'Tenant name' })
  name: string;

  @ApiProperty({ description: 'Parent tenant information', required: false })
  parentTenant?: ParentTenantDto;
}

export class ServiceDto {
  @ApiProperty({ description: 'Service ID' })
  id: string;

  @ApiProperty({ description: 'Service name' })
  servicesName: string;
}

export class VendorServiceDto {
  @ApiProperty({
    description: 'Vendor service type',
    enum: VendorServiceType,
    enumName: 'VendorServiceType',
  })
  vendorServiceType: VendorServiceType;

  @ApiProperty({ description: 'Service information' })
  service: ServiceDto;
}

export class PotentialVendorResponseDto {
  @ApiProperty({ description: 'Vendor ID' })
  id: string;

  @ApiProperty({ description: 'Vendor name' })
  name: string;

  @ApiProperty({ description: 'Vendor logo URL', required: false })
  logo?: string;

  @ApiProperty({
    description: 'Vendor status',
    enum: VendorStatuses,
    enumName: 'VendorStatuses',
  })
  status: VendorStatuses;

  @ApiProperty({
    description: 'Vendor stage',
    enum: VendorStages,
    enumName: 'VendorStages',
  })
  stage: VendorStages;

  @ApiProperty({ description: 'Vendor address', required: false })
  address?: string;

  @ApiProperty({ description: 'Vendor website', required: false })
  website?: string;

  @ApiProperty({ description: 'City information', required: false })
  city?: CityDto;

  @ApiProperty({ description: 'State information', required: false })
  state?: StateDto;

  @ApiProperty({ description: 'Country information', required: false })
  country?: CountryDto;

  @ApiProperty({
    description: 'Whether vendor covers continental US',
    required: false,
  })
  vendorServiceCoverContinentalUs?: boolean;

  @ApiProperty({
    description:
      'Whether vendor is interested in receiving RFPs outside their service area',
    required: false,
  })
  vendorInterestedReceiveRfpOutside?: boolean;

  @ApiProperty({ description: 'Parent company information', required: false })
  parentCompany?: ParentCompanyDto;

  @ApiProperty({ description: 'Tenant information' })
  tenant: TenantDto;

  @ApiProperty({ description: 'Vendor service information' })
  vendorService: VendorServiceDto;

  @ApiProperty({
    description: 'Type of match for this vendor',
    enum: VendorMatchType,
    enumName: 'VendorMatchType',
  })
  matchType: VendorMatchType;

  @ApiProperty({
    description: 'Matching serviceable area information',
    required: false,
  })
  matchingServiceableArea?: ServiceableAreaDto;
}
