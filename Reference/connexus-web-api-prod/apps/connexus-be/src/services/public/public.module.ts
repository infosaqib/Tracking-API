import { Module } from '@nestjs/common';
import { SesModule } from 'src/libs/ses/ses.module';
import { CitiesModule } from '../cities/cities.module';
import { StatesModule } from '../states/states.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  controllers: [PublicController],
  providers: [PublicService],
  imports: [SesModule, StatesModule, CitiesModule],
})
export class PublicModule {}
