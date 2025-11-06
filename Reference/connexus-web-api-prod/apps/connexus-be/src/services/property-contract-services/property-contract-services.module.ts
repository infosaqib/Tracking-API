import { Module } from '@nestjs/common';
import { PropertyContractServicesController } from './property-contract-services.controller';
import { PropertyContractServicesService } from './property-contract-services.service';

@Module({
  controllers: [PropertyContractServicesController],
  providers: [PropertyContractServicesService],
})
export class PropertyContractServicesModule {}
