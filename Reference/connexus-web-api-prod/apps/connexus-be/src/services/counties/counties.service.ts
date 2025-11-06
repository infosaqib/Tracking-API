import { PrismaService as PrismaClientService } from '@app/prisma';
import { getSortInput } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetCountiesDto } from './dto/get-counties.dto';

@Injectable()
export class CountiesService {
  constructor(private readonly prismaService: PrismaClientService) {}

  async findAll(getCountiesDto: GetCountiesDto) {
    const { stateIds, name } = getCountiesDto;

    const where: Prisma.CountyWhereInput = {};

    if (stateIds?.length && stateIds.length > 0) {
      where.stateId = { in: stateIds };
    }

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    const orderBy = getSortInput({
      sort: getCountiesDto.sort,
      sortDirection: getCountiesDto.sortDirection,
      modelName: Prisma.ModelName.County,
      defaultSort: 'name',
    });

    const [data, pagination] = await this.prismaService.client.county
      .paginate({
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          stateId: true,
        },
      })
      .withPages({
        page: getCountiesDto.page,
        limit: getCountiesDto.limit,
      });

    return { data, pagination };
  }
}
