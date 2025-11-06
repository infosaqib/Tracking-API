import { Module } from '@nestjs/common';
import { StatesController } from './states.controller';
import { StatesService } from './states.service';

@Module({
  controllers: [StatesController],
  providers: [StatesService],
  imports: [],
  exports: [StatesService],
})
export class StatesModule {}
