import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BuildingClassification,
  CommercialType,
  HOAType,
  MultiFamilyBuildingTypes,
  PropertyBuildingTypes,
  PropertyStatuses,
  StudentHousingType,
} from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';

export class UpdatePropertyDto {
  @ApiProperty({ description: 'Name of the property' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Legal name of the property', required: false })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiProperty({
    description: 'Type of the property building',
    enum: PropertyBuildingTypes,
  })
  @IsOptional()
  @IsEnum(PropertyBuildingTypes)
  type: PropertyBuildingTypes;

  @ApiProperty({ description: 'Is the property retail?', default: false })
  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  isRetail: boolean;

  @ApiProperty({ description: 'Is the retail scope defined?', default: false })
  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  isRetailScope: boolean;

  @ApiProperty({ description: 'Website of the property', required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  website?: string;

  @ApiProperty({
    description: 'Status of the property',
    default: 'ACTIVE',
    enum: PropertyStatuses,
    enumName: 'PropertyStatuses',
  })
  @IsOptional()
  @IsEnum(PropertyStatuses)
  status: PropertyStatuses;

  @ApiProperty({ description: 'Manager ID of the property' })
  @IsString()
  @IsOptional()
  managerId?: string;

  // --------

  @ApiProperty({ description: 'Address of the property', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'City ID of the property' })
  @IsString()
  @IsOptional()
  cityId?: string;

  @ApiProperty({ description: 'County ID of the property' })
  @IsString()
  @IsOptional()
  countyId?: string;

  @ApiProperty({ description: 'State ID of the property' })
  @IsString()
  @IsOptional()
  stateId?: string;

  @ApiProperty({ description: 'Country ID of the property', required: true })
  @IsString()
  @IsOptional()
  countryId?: string;

  @ApiProperty({ description: 'Zip code of the property', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip?: string;

  @ApiProperty({ description: 'Unit count of the property' })
  @IsOptional()
  @IsInt({
    message: 'Unit count must be an integer',
  })
  unitCount: number;

  @ApiProperty({ description: 'Building count of the property' })
  @IsOptional()
  @IsInt()
  buildingCount: number;

  @ApiProperty({ description: 'Floor count of the property' })
  @IsOptional()
  @IsInt()
  floorCount: number;

  @ApiProperty({ description: 'Acres of the property', required: false })
  @IsOptional()
  @IsNumber()
  acres?: number;

  @ApiProperty({ description: 'Note about the property', required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ description: 'Latitude of the property', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude of the property', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Year built (1800-current)',
    minimum: 1800,
  })
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(new Date().getFullYear())
  yearBuilt?: number;

  // HOA specific fields
  @ApiPropertyOptional({
    description: 'HOA Type',
    enum: HOAType,
    enumName: 'HOAType',
  })
  @IsOptional()
  @IsEnum(HOAType)
  hoaType?: HOAType;

  @ApiPropertyOptional({ description: 'Number of doors for HOA properties' })
  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfDoors?: number;

  // Multifamily/Apartments specific fields
  @ApiPropertyOptional({
    description: 'Building Classification',
    enum: BuildingClassification,
    enumName: 'BuildingClassification',
  })
  @IsOptional()
  @IsEnum(BuildingClassification)
  buildingClassification?: BuildingClassification;

  @ApiPropertyOptional({ description: 'Market information' })
  @IsOptional()
  @IsString()
  market?: string;

  // Commercial/Retail specific fields
  @ApiPropertyOptional({
    description: 'Commercial Type',
    enum: CommercialType,
    enumName: 'CommercialType',
  })
  @IsOptional()
  @IsEnum(CommercialType)
  commercialType?: CommercialType;

  @ApiPropertyOptional({
    description: 'Commercial Classification',
    enum: BuildingClassification,
    enumName: 'BuildingClassification',
  })
  @IsOptional()
  @IsEnum(BuildingClassification)
  commercialClassification?: BuildingClassification;

  @ApiPropertyOptional({ description: 'Gross square footage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grossSquareFootage?: number;

  @ApiPropertyOptional({ description: 'Rentable square footage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rentableSquareFootage?: number;

  // Student Housing specific fields
  @ApiPropertyOptional({
    description: 'Student Housing Type',
    enum: StudentHousingType,
    enumName: 'StudentHousingType',
  })
  @IsOptional()
  @IsEnum(StudentHousingType)
  studentHousingType?: StudentHousingType;

  @ApiPropertyOptional({ description: 'Number of beds for student housing' })
  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfBeds?: number;

  @ApiPropertyOptional({
    description: 'Multi Family Building Type',
    enum: MultiFamilyBuildingTypes,
    enumName: 'MultiFamilyBuildingTypes',
  })
  @IsOptional()
  @IsEnum(MultiFamilyBuildingTypes)
  multiFamilyBuildingType?: MultiFamilyBuildingTypes;

  @ApiPropertyOptional({ description: 'Number of units' })
  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfUnits?: number;

  @ApiPropertyOptional({
    description: 'A flat array of service IDs for the property',
    type: [String],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];
}

export class UpdatePropertyStatusDto {
  @ApiProperty({
    description: 'Status of the property',
    enum: PropertyStatuses,
    enumName: 'PropertyStatuses',
  })
  @IsEnum(PropertyStatuses)
  status: PropertyStatuses;
}
