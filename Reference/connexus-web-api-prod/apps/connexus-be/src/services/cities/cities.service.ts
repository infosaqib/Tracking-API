import { PrismaService as PrismaClientService } from '@app/prisma';
import { getSortInput } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetCityDto } from './dto/get-city.dto';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaClientService) {}

  async findAll(getCityDto: GetCityDto) {
    const { countryIds, stateIds, name, ...paginationInput } = getCityDto;

    const filters: Prisma.CitiesWhereInput = {
      ...(countryIds && { countryId: { in: countryIds } }),
      ...(stateIds && { stateId: { in: stateIds } }),
      isDeleted: false,
    };

    if (name) {
      filters.cityName = { contains: name, mode: 'insensitive' };
    }

    const sort = getSortInput({
      sort: paginationInput.sort,
      sortDirection: getCityDto.sortDirection,
      modelName: Prisma.ModelName.Cities,
      defaultSort: 'cityName',
    });

    const [data, pagination] = await this.prisma.client.cities
      .paginate({
        where: filters,
        orderBy: sort,
        select: {
          id: true,
          cityName: true,
          state: {
            select: {
              id: true,
              stateName: true,
              country: {
                select: {
                  id: true,
                  countryName: true,
                },
              },
            },
          },
        },
      })
      .withPages({
        page: paginationInput.page,
        limit: paginationInput.limit,
      });

    return { data, pagination };
  }
}
