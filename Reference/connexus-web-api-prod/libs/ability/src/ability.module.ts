import { PrismaModule } from '@app/prisma';
import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability-factory/casl-ability.factory';

@Module({
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
  imports: [PrismaModule],
})
export class AbilityModule {}
