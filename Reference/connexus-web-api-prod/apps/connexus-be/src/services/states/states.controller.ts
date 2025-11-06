import { RouteController } from '@app/shared';
import { Get, Query } from '@nestjs/common';
import { GetStateDto } from './dto/get-state.dto';
import { StatesService } from './states.service';

@RouteController('states', {
  security: 'public',
})
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  @Get()
  find(@Query() getStateDto: GetStateDto) {
    return this.statesService.find(getStateDto);
  }
}
