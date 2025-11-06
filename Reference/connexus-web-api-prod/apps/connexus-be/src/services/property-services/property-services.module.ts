import { Module } from '@nestjs/common';
import { PropertyServicesService } from './property-services.service';
import { PropertyServicesController } from './property-services.controller';

@Module({
  controllers: [PropertyServicesController],
  providers: [PropertyServicesService],
})
export class PropertyServicesModule {}
