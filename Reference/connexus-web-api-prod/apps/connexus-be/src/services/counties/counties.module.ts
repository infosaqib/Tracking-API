import { Module } from '@nestjs/common';
import { CountiesService } from './counties.service';
import { CountiesController } from './counties.controller';

@Module({
  controllers: [CountiesController],
  providers: [CountiesService],
})
export class CountiesModule {}
