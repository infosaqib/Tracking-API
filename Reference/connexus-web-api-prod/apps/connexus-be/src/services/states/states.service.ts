import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetStateDto } from './dto/get-state.dto';

@Injectable()
export class StatesService {
  constructor(private readonly prismaService: PrismaClientService) {}

  async find(input: GetStateDto) {
    const { limit, page } = input;

    const filters: Prisma.StatesWhereInput = {
      isDeleted: false,
    };

    if (input.stateName) {
      filters.stateName = {
        contains: input.stateName,
        mode: 'insensitive',
      };
    }

    if (input.countryId) {
      filters.countryId = input.countryId;
    }

    const [data, pagination] = await this.prismaService.client.states
      .paginate({
        where: filters,
        select: {
          id: true,
          stateName: true,
          countryId: true,
        },
        orderBy: {
          stateName: 'asc',
        },
      })
      .withPages(getPaginationInput({ page, limit }));

    return {
      data,
      pagination,
    };
  }
}
