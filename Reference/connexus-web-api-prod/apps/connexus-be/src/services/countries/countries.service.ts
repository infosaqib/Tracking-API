import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetCountryDto } from './dto/get-country.dto';

@Injectable()
export class CountriesService {
  constructor(private readonly prismaService: PrismaClientService) {}

  async findAll(input: GetCountryDto) {
    const { limit, page } = input;

    const filters: Prisma.CountriesWhereInput = {};

    if (input.countryName) {
      filters.countryName = {
        contains: input.countryName,
        mode: 'insensitive',
      };
    }

    const [data, pagination] = await this.prismaService.client.countries
      .paginate({
        where: filters,
        select: {
          id: true,
          countryName: true,
        },
        orderBy: {
          countryName: 'asc',
        },
      })
      .withPages(getPaginationInput({ page, limit }));

    return {
      data,
      pagination,
    };
  }
}
