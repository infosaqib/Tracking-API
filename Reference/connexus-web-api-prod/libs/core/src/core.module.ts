import { Module } from '@nestjs/common';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { CoreService } from './core.service';

@Module({
  imports: [BootstrapModule],
  providers: [CoreService],
  exports: [CoreService, BootstrapModule],
})
export class CoreModule {}
