import { PrismaModule } from '@app/prisma';
import { SqsModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { RfpController } from './rfp.controller';
import { RfpService } from './rfp.service';

@Module({
  imports: [PrismaModule, SqsModule],
  controllers: [RfpController],
  providers: [RfpService],
})
export class RfpModule {}
