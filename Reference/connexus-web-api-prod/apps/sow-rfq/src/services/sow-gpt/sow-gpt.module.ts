import { CoreModule } from '@app/core';
import { GptService, SharedModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { SowGptController } from './sow-gpt.controller';
import { SowGptService } from './sow-gpt.service';

@Module({
  imports: [CoreModule, SharedModule],
  controllers: [SowGptController],
  providers: [SowGptService, GptService, PrismaService],
  exports: [SowGptService],
})
export class SowGptModule {}
