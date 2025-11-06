import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
  controllers: [ContractsController],
  imports: [ClientsModule],
  providers: [ContractsService],
})
export class ContractsModule {}
