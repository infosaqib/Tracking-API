import { AbilityModule } from '@app/ability';
import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService],
  imports: [AbilityModule],
  exports: [RolesService],
})
export class RolesModule {}
