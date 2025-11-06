import { Global, Module } from '@nestjs/common';
import { APP_FILTER, HttpAdapterHost } from '@nestjs/core';
import { CustomPrismaModule, PrismaClientExceptionFilter } from 'nestjs-prisma';
import { ExtendedPrismaConfigService } from './prisma.extended.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useFactory: ({ httpAdapter }: HttpAdapterHost) => {
        return new PrismaClientExceptionFilter(httpAdapter);
      },
      inject: [HttpAdapterHost],
    },
  ],
  exports: [PrismaService],
  imports: [
    CustomPrismaModule.forRootAsync({
      name: 'PrismaService',
      isGlobal: true,
      useClass: ExtendedPrismaConfigService,
    }),
  ],
})
export class PrismaModule {}
