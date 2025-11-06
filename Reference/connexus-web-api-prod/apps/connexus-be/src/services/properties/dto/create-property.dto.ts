import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BuildingClassification,
  CommercialType,
  HOAType,
  MultiFamilyBuildingTypes,
  PropertyBuildingTypes,
  PropertyStatuses,
  StudentHousingType,
} from '@prisma/client'; // Adjust import based on your setup
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreatePropertyUserDto } from 'src/types/property-types';
import { TransformBoolean } from 'src/utils/transform';

export class CreatePropertyDto {
  @ApiProperty({ description: 'Client ID of the property' })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: 'Name of the property' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Legal name of the property', required: false })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiProperty({
    description: 'Manager first  name of the property',
  })
  @IsString()
  @IsOptional()
  managerId?: string;

  @ApiProperty({
    description: 'Manager first  name of the property',
  })
  @IsString()
  @IsNotEmpty()
  managerFirstName?: string;

  @ApiProperty({
    description: 'Manager last name of the property',
  })
  @IsString()
  @IsNotEmpty()
  managerLastName?: string;

  @ApiProperty({
    description: 'Manger email of the property',
  })
  @IsEmail()
  @IsNotEmpty()
  managerEmail?: string;

  @ApiProperty({
    description: 'Manager phone code of the property',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsOptional()
  managerPhoneCode?: string;

  @ApiProperty({
    description: 'Manager phone extension of the property',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsOptional()
  managerPhoneExtension?: string;

  @ApiProperty({
    description: 'Manager phone of the property',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsOptional()
  managerPhone?: string;

  @ApiProperty({
    description: 'Type of the property building',
    enum: PropertyBuildingTypes,
  })
  @IsNotEmpty()
  @IsEnum(PropertyBuildingTypes)
  type: PropertyBuildingTypes;

  @ApiProperty({ description: 'Is the property retail?', default: false })
  @IsNotEmpty()
  @IsBoolean()
  @TransformBoolean()
  isRetail: boolean;

  @ApiProperty({ description: 'Is the retail scope defined?', default: false })
  @IsNotEmpty()
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
  @IsNotEmpty()
  @IsEnum(PropertyStatuses)
  status: PropertyStatuses;

  // --------

  @ApiProperty({ description: 'Address of the property', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'City ID of the property' })
  @IsString()
  @IsOptional()
  cityId?: string;

  @ApiProperty({ description: 'County ID of the property', required: false })
  @IsString()
  @IsOptional()
  countyId?: string;

  @ApiProperty({ description: 'State ID of the property' })
  @IsString()
  @IsOptional()
  stateId?: string;

  @ApiProperty({ description: 'Country ID of the property', required: false })
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiProperty({ description: 'Zip code of the property', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @MinLength(3)
  zip?: string;

  @ApiProperty({ description: 'Unit count of the property' })
  @IsNotEmpty()
  @IsInt()
  @Max(9999999999)
  unitCount: number;

  @ApiProperty({ description: 'Building count of the property' })
  @IsNotEmpty()
  @IsInt()
  buildingCount: number;

  @ApiProperty({ description: 'Floor count of the property' })
  @IsNotEmpty()
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

  @ApiProperty({
    description: 'Users of the property',
    type: CreatePropertyUserDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePropertyUserDto)
  users: CreatePropertyUserDto[];

  @ApiProperty({
    description: 'A flat array of service IDs for the property',
    type: [String],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  services?: string[];

  @ApiPropertyOptional({
    description: 'Year built (1800-current)',
    minimum: 1800,
  })
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(new Date().getFullYear())
  yearBuilt?: number;

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
}
