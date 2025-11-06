import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';

export class ServiceableAreaDto {
  @ApiProperty({
    description: 'Country ID for the serviceable area',
  })
  @IsString()
  countryId: string;

  @ApiProperty({
    description: 'State ID for the serviceable area',
  })
  @IsString()
  stateId: string;

  @ApiProperty({
    description: 'City ID for the serviceable area',
    required: false,
  })
  @IsString()
  @IsOptional()
  cityId: string;

  @ApiProperty({
    description: 'County ID for the serviceable area',
    required: false,
  })
  @IsString()
  @IsOptional()
  countyId: string;

  // if nothing has been provided
  // @ValidateIf((o) => !o.cityId && !o.countyId)
  // @IsDefined({ message: messages.errorMessages.provideEitherCityOrCounty })
  // protected readonly atLeastOne: undefined;

  // if both have been provided
  // @ValidateIf((o) => o.cityId && o.countyId)
  // @IsDefined({ message: messages.errorMessages.cannotHaveBothCityAndCounty })
  // protected readonly atMostOne: undefined;
  // @ValidateIf((o) => (!o.cityId && !o.countyId) || (o.cityId && o.countyId))
  // @IsDefined({
  //   message: messages.errorMessages.provideEitherCityOrCounty,
  // })
  // protected readonly exactlyOne: undefined;
}

export class UpdateVendorServiceAreaDto {
  @ApiProperty({
    description: 'Whether vendor covers continental US',
  })
  @IsBoolean()
  @TransformBoolean()
  vendorServiceCoverContinentalUs: boolean;

  @ApiProperty({
    description: 'Array of serviceable areas',
    type: [ServiceableAreaDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ServiceableAreaDto)
  @ValidateIf((o) => o.vendorServiceCoverContinentalUs === false)
  serviceableAreas?: ServiceableAreaDto[];

  @ApiProperty({
    description:
      'Whether vendor interested in receiving RFPs outside of continental US',
  })
  @IsBoolean()
  @TransformBoolean()
  vendorInterestedReceiveRfpOutside: boolean;
}
