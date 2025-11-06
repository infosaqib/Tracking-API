import { RouteController } from '@app/shared';
import { Get, Query } from '@nestjs/common';
import { CountiesService } from './counties.service';
import { GetCountiesDto } from './dto/get-counties.dto';

@RouteController('counties')
export class CountiesController {
  constructor(private readonly countiesService: CountiesService) {}

  @Get()
  async findAll(@Query() getCountiesDto: GetCountiesDto) {
    return this.countiesService.findAll(getCountiesDto);
  }
}
