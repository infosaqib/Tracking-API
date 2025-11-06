import { PaginationDto as PaginationInput } from '@app/shared';
import { IsOptional, IsString } from 'class-validator';

export class GetCountryDto extends PaginationInput {
  @IsOptional()
  @IsString()
  countryName: string;
}
