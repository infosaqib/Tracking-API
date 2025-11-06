import { PrismaService as PrismaClientService } from '@app/prisma';
import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

@Module({
  controllers: [AgentController],
  providers: [AgentService, PrismaClientService],
  exports: [AgentService],
})
export class AgentModule {}
