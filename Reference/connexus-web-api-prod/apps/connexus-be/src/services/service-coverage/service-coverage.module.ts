import { PrismaModule } from '@app/prisma';
import { Module } from '@nestjs/common';
import { ServiceCoverageService } from './service-coverage.service';

@Module({
  imports: [PrismaModule],
  providers: [ServiceCoverageService],
  exports: [ServiceCoverageService],
})
export class ServiceCoverageModule {}
