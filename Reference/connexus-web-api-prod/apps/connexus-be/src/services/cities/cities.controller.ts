import { RouteController } from '@app/shared';
import { Get, Query } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { GetCityDto } from './dto/get-city.dto';

@RouteController('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  async findAll(@Query() getCityDto: GetCityDto) {
    return this.citiesService.findAll(getCityDto);
  }
}
