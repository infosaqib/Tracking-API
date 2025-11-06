import { PrismaModule } from '@app/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { RfpPropertyAttachmentsController } from './rfp-property-attachments.controller';
import { RfpPropertyAttachmentsService } from './rfp-property-attachments.service';

@Module({
  imports: [PrismaModule],
  controllers: [RfpPropertyAttachmentsController],
  providers: [RfpPropertyAttachmentsService],
})
export class RfpPropertyAttachmentsModule {}
