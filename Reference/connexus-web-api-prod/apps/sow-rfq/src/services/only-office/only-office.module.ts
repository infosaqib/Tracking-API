import { S3Module } from '@app/shared/s3';
import { Module } from '@nestjs/common';
import { ScopeOfWorkVersionModule } from '../scope-of-work-version/scope-of-work-version.module';
import { OnlyOfficeController } from './only-office.controller';
import { OnlyOfficeService } from './only-office.service';

@Module({
  imports: [S3Module, ScopeOfWorkVersionModule],
  controllers: [OnlyOfficeController],
  providers: [OnlyOfficeService],
  exports: [OnlyOfficeService],
})
export class OnlyOfficeModule {}
