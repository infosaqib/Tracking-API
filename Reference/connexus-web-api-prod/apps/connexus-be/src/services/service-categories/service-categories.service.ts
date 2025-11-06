import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput, getSortInput } from '@app/shared';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { GetServiceCategoriesDto } from './dto/get-service-categories.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Injectable()
export class ServiceCategoriesService {
  constructor(private readonly prisma: PrismaClientService) {}

  async create(input: CreateServiceCategoryDto) {
    // Check if service category with the same name already exists
    const existingCategory =
      await this.prisma.client.serviceCategories.findFirst({
        where: {
          name: {
            equals: input.name,
            mode: 'insensitive',
          },
          deletedAt: null,
        },
      });

    if (existingCategory) {
      throw new ConflictException(
        `Service category with name "${input.name}" already exists`,
      );
    }

    const category = await this.prisma.client.serviceCategories.create({
      data: {
        name: input.name,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return category;
  }

  async findAll(input: GetServiceCategoriesDto) {
    const where: Prisma.ServiceCategoriesWhereInput = {
      deletedAt: null,
    };

    if (input.search) {
      where.OR = [
        {
          name: {
            contains: input.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [data, pagination] = await this.prisma.client.serviceCategories
      .paginate({
        where,
        orderBy: getSortInput({
          modelName: Prisma.ModelName.ServiceCategories,
          sortDirection: input.sortDirection || 'desc',
          sort: input.sort,
          defaultSort: 'createdAt',
        }),
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .withPages(getPaginationInput(input));

    return {
      data,
      pagination,
    };
  }

  async findOne(id: string) {
    const category =
      await this.prisma.client.serviceCategories.findFirstOrThrow({
        where: { id, deletedAt: null },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!category) {
      throw new NotFoundException(`Service category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, input: UpdateServiceCategoryDto) {
    const serviceCategory =
      await this.prisma.client.serviceCategories.findFirst({
        where: { id, deletedAt: null },
      });

    if (!serviceCategory) {
      throw new NotFoundException(`Service category with ID ${id} not found`);
    }

    if (input.name) {
      const duplicateCategory =
        await this.prisma.client.serviceCategories.findFirst({
          where: {
            name: {
              equals: input.name,
              mode: 'insensitive',
            },
            id: {
              not: id,
            },
            deletedAt: null,
          },
        });

      if (duplicateCategory) {
        throw new ConflictException(
          `Service category with name "${input.name}" already exists`,
        );
      }
    }

    const category = await this.prisma.client.serviceCategories.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return category;
  }

  async remove(id: string) {
    // Check if service category exists
    const existingCategory =
      await this.prisma.client.serviceCategories.findUnique({
        where: { id, deletedAt: null },
        include: {
          services: {
            where: {
              deletedAt: null,
            },
          },
        },
      });

    if (!existingCategory) {
      throw new NotFoundException(`Service category with ID ${id} not found`);
    }

    // Check if category is being used by any services
    if (existingCategory.services.length > 0) {
      throw new ConflictException(
        `Cannot delete service category "${existingCategory.name}" as it is being used by ${existingCategory.services.length} service(s)`,
      );
    }

    await this.prisma.client.serviceCategories.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: `Service category "${existingCategory.name}" has been deleted successfully`,
    };
  }

  async validateCategoryName(name: string, excludeId?: string) {
    const where: Prisma.ServiceCategoriesWhereInput = {
      name: {
        equals: name,
        mode: 'insensitive',
      },
      deletedAt: null,
    };

    if (excludeId) {
      where.id = {
        not: excludeId,
      };
    }

    const existingCategory =
      await this.prisma.client.serviceCategories.findFirst({
        where,
      });

    return !existingCategory;
  }
}
