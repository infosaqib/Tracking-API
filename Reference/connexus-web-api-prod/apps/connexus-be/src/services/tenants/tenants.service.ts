import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput, getSortInput } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SearchTenantDto } from './dto/search-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prismaClientService: PrismaClientService) {}

  async tenantSearch(getTenantDto: SearchTenantDto) {
    const { limit, page, query } = getTenantDto;

    const where: Prisma.TenantsWhereInput = {};

    if (query) {
      where.OR = [
        {
          client: {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
        {
          vendor: {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (getTenantDto.type) {
      where.type = getTenantDto.type;
    }

    const orderBy = getSortInput({
      modelName: Prisma.ModelName.Tenants,
      sortDirection: getTenantDto.sortDirection,
      sort: getTenantDto.sort,
      defaultSort: 'createdAt',
      nestedSortLevel: 3,
    });

    const [data, pagination] = await this.prismaClientService.client.tenants
      .paginate({
        where,
        select: {
          id: true,
          type: true,
          name: true,
          vendorId: true,
          clientId: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy,
      })
      .withPages(getPaginationInput({ page, limit }));

    return {
      data,
      pagination,
    };
  }
}
