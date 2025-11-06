import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

import { PaginationDto as PaginationInput } from '@app/shared';

export class GetCityDto extends PaginationInput {
  @ApiPropertyOptional({
    description: 'Country ID of the city',
    name: 'countryIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  countryIds: string[];

  @ApiPropertyOptional({
    description: 'State ID of the city',
    name: 'stateIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  stateIds: string[];

  @ApiPropertyOptional({
    description: 'Search by name',
    name: 'name',
  })
  @IsOptional()
  @IsString()
  name: string;
}
