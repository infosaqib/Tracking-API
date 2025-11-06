import { RouteController } from '@app/shared';
import { Get, Query } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { GetCountryDto } from './dto/get-country.dto';

@RouteController('countries', {
  security: 'public',
})
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  findAll(@Query() query: GetCountryDto) {
    return this.countriesService.findAll(query);
  }
}
