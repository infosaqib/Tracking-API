import { PrismaModule } from '@app/prisma';
import { S3Module } from '@app/shared/s3';
import { Module } from '@nestjs/common';
import { ScopeOfWorkVersionService } from './scope-of-work-version.service';

@Module({
  exports: [ScopeOfWorkVersionService],
  providers: [ScopeOfWorkVersionService],
  imports: [PrismaModule, S3Module],
})
export class ScopeOfWorkVersionModule {}
