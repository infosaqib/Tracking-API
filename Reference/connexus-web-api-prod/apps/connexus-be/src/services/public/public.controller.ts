import { RouteController } from '@app/shared';
import { Body, Get, Post, Query } from '@nestjs/common';
import { CitiesService } from '../cities/cities.service';
import { GetCityDto } from '../cities/dto/get-city.dto';
import { GetStateDto } from '../states/dto/get-state.dto';
import { StatesService } from '../states/states.service';
import { GetInTouchDto } from './dto/get-in-touch.dto';
import { PublicService } from './public.service';

@RouteController('public', {
  security: 'public',
})
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly stateService: StatesService,
    private readonly citiesService: CitiesService,
  ) {}

  @Post('/get-in-touch')
  async getInTouch(@Body() getInTouchDto: GetInTouchDto) {
    return this.publicService.sendGetInTouchEmail(getInTouchDto);
  }

  @Get('/states')
  async getStates(@Query() input: GetStateDto) {
    return this.stateService.find(input);
  }

  @Get('/cities')
  async getCities(@Query() input: GetCityDto) {
    return this.citiesService.findAll(input);
  }
}
