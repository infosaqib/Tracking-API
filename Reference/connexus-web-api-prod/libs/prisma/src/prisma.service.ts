import { Inject, Injectable } from '@nestjs/common';
import { CustomPrismaService } from 'nestjs-prisma';
import { ExtendedPrismaClient } from './prisma.extension';

@Injectable()
export class PrismaService {
  constructor(
    @Inject('PrismaService')
    private prismaServiceConfig: CustomPrismaService<ExtendedPrismaClient>,
  ) {}

  public client = this.prismaServiceConfig.client;
}
