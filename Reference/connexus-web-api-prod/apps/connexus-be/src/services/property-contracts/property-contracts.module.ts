import { Module } from '@nestjs/common';
import { PropertyContractsService } from './property-contracts.service';
import { PropertyContractsController } from './property-contracts.controller';

@Module({
  controllers: [PropertyContractsController],
  providers: [PropertyContractsService],
})
export class PropertyContractsModule {}
