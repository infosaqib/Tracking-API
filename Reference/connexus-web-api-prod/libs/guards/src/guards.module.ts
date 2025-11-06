import { Module } from '@nestjs/common';
import { AuthGuard } from './auth/auth.guard';
import { PolicyGuard } from './policy/policy.guard';

@Module({
  providers: [AuthGuard, PolicyGuard],
  exports: [AuthGuard, PolicyGuard],
})
export class GuardsModule {}
