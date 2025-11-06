import { PrismaService as PrismaClientService } from '@app/prisma';
import {
  getEndOfDay,
  getPaginationInput,
  getSortInput,
  getStartofDay,
  RequestUser,
} from '@app/shared';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ServiceStatus } from '@prisma/client';
import { isDefined } from 'src/utils/helpers';
import { BulkUpdateServicesDto } from './dto/bulk-update-services.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { GetAllSubServicesDto } from './dto/get-all-sub-services.dto';
import { GetServicesDto } from './dto/get-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaClientService) {}

  async create(input: CreateServiceDto, user: RequestUser) {
    const existingService = await this.prisma.client.services.findFirst({
      where: {
        servicesName: {
          equals: input.servicesName,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    if (existingService) {
      throw new ConflictException(
        `Service with name ${input.servicesName} already exists`,
      );
    }
    const serviceCategory =
      await this.prisma.client.serviceCategories.findFirst({
        where: {
          id: input.categoryId,
          deletedAt: null,
        },
      });

    if (!serviceCategory) {
      throw new ConflictException(
        `Service category with ID ${input.categoryId} not found`,
      );
    }

    let parentService = null;
    if (input.parentServiceId) {
      parentService = await this.prisma.client.services.findFirst({
        where: { id: input.parentServiceId, deletedAt: null },
      });
      if (!parentService) {
        throw new NotFoundException(
          `Parent service with ID ${input.parentServiceId} not found`,
        );
      }
    }

    return this.prisma.client.services.create({
      data: {
        servicesName: input.servicesName,
        serviceDescription: input.serviceDescription,
        category: parentService ? parentService.category : input.category,
        categoryId: parentService ? parentService.categoryId : input.categoryId,
        status: parentService ? parentService.status : ServiceStatus.ACTIVE,
        creatorId: user.connexus_user_id,
        serviceApprovedById: user.connexus_user_id,
        serviceApprovedOn: new Date(),
        parentServiceId: input.parentServiceId,
      },
      select: {
        id: true,
        servicesName: true,
        serviceDescription: true,
        category: true,
        serviceCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        serviceApprovedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        serviceApprovedOn: true,
      },
    });
  }

  async findAll(input: GetServicesDto) {
    const where: Prisma.ServicesWhereInput = {
      deletedAt: null,
      ...(input.status && { status: input.status }),
      ...(input.category?.length > 0 && { category: { in: input.category } }),
      ...(input.categoryIds?.length > 0 && {
        categoryId: { in: input.categoryIds },
      }),
      ...(input.approvedBy && {
        serviceApprovedById: { in: input.approvedBy },
      }),
    };

    if (input.search) {
      where.OR = [
        { servicesName: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    if (input.serviceApprovedOn) {
      where.serviceApprovedOn = {
        gte: getStartofDay(input.serviceApprovedOn),
        lte: getEndOfDay(input.serviceApprovedOn),
      };
    }

    if (input.createdAt) {
      where.createdAt = {
        gte: getStartofDay(input.createdAt),
        lte: getEndOfDay(input.createdAt),
      };
    }

    const [data, pagination] = await this.prisma.client.services
      .paginate({
        where,
        orderBy: getSortInput({
          modelName: Prisma.ModelName.Services,
          sortDirection: input.sortDirection,
          sort: input.sort,
          defaultSort: 'createdAt',
        }),
        select: {
          id: true,
          servicesName: true,
          serviceDescription: true,
          category: true,
          serviceCategory: {
            select: {
              id: true,
              name: true,
            },
          },
          serviceApprovedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          serviceApprovedOn: true,
          createdAt: true,
          status: true,
        },
      })
      .withPages(getPaginationInput(input));

    return {
      data,
      pagination,
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.client.services.findFirstOrThrow({
      where: { id, deletedAt: null },
      select: {
        id: true,
        servicesName: true,
        serviceDescription: true,
        category: true,
        serviceCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        serviceApprovedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        serviceApprovedOn: true,
        status: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async update(id: string, input: UpdateServiceDto, user: RequestUser) {
    const service = await this.prisma.client.services.findFirst({
      where: { id, deletedAt: null },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const serviceCategory =
      await this.prisma.client.serviceCategories.findFirst({
        where: {
          id: input.categoryId,
          deletedAt: null,
        },
      });

    if (!serviceCategory) {
      throw new ConflictException(
        `Service category with ID ${input.categoryId} not found`,
      );
    }

    if (input.servicesName) {
      await this.validateServiceNames({
        serviceNames: [input.servicesName],
        excludeServiceIds: [id],
      });
    }

    return this.prisma.client.services.update({
      where: { id },
      data: {
        ...(input.servicesName && { servicesName: input.servicesName }),
        ...(input.serviceDescription !== undefined && {
          serviceDescription: input.serviceDescription,
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        updaterId: user.connexus_user_id,
      },
    });
  }

  async remove(id: string, user: RequestUser) {
    const service = await this.prisma.client.services.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        _count: {
          select: {
            childServices: true,
            contractServices: true,
            propertyServiceMap: true,
            scopeOfWork: true,
            vendorServices: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const { _count: count } = service;
    const isDeletable =
      count.childServices === 0 &&
      count.contractServices === 0 &&
      count.propertyServiceMap === 0 &&
      count.scopeOfWork === 0 &&
      count.vendorServices === 0;

    if (!isDeletable) {
      const relations = [
        count.childServices > 0 && 'child services',
        count.contractServices > 0 && 'contracts',
        count.propertyServiceMap > 0 && 'properties',
        count.scopeOfWork > 0 && 'scopes of work',
        count.vendorServices > 0 && 'vendors',
      ]
        .filter(isDefined)
        .join(', ');

      throw new ConflictException(
        `This service cannot be deleted because it is associated with ${relations}.`,
      );
    }

    return this.prisma.client.services.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updaterId: user.connexus_user_id,
      },
      select: { id: true },
    });
  }

  async validateServiceNames({
    serviceNames,
    excludeServiceIds = [],
  }: {
    serviceNames: string[];
    excludeServiceIds?: string[];
  }) {
    const conflictingServices = await this.prisma.client.services.findMany({
      where: {
        servicesName: {
          in: serviceNames,
          mode: 'insensitive',
        },
        id: {
          notIn: excludeServiceIds,
        },
        deletedAt: null,
      },
      select: {
        servicesName: true,
      },
    });

    if (conflictingServices.length > 0) {
      const names = conflictingServices.map((s) => s.servicesName).join(', ');
      throw new ConflictException(
        `The following service names already exist: ${names}`,
      );
    }
  }

  async bulkUpdate(input: BulkUpdateServicesDto, user: RequestUser) {
    const serviceIds = input.services.map((service) => service.id);

    // Check if all services exist and are not deleted
    const existingServices = await this.prisma.client.services.findMany({
      where: {
        id: { in: serviceIds },
        deletedAt: null,
      },
    });

    if (existingServices.length !== serviceIds.length) {
      const foundIds = existingServices.map((service) => service.id);
      const missingIds = serviceIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Services not found: ${missingIds.join(', ')}`,
      );
    }

    // Validate service names if they are being updated
    const serviceNamesToValidate = input.services
      .filter((service) => service.servicesName)
      .map((service) => service.servicesName as string);

    if (serviceNamesToValidate.length > 0) {
      await this.validateServiceNames({
        serviceNames: serviceNamesToValidate,
        excludeServiceIds: serviceIds,
      });
    }

    // Perform bulk update using transaction
    const updates = input.services.map((service) => {
      const updateData: Prisma.ServicesUpdateInput = {
        ...(isDefined(service.servicesName) && {
          servicesName: service.servicesName,
        }),
        ...(isDefined(service.serviceDescription) && {
          serviceDescription: service.serviceDescription,
        }),
        ...(isDefined(service.category) && { category: service.category }),
        ...(isDefined(service.status) && { status: service.status }),
        updater: {
          connect: {
            id: user.connexus_user_id,
          },
        },
      };

      return this.prisma.client.services.update({
        where: { id: service.id },
        data: updateData,
        select: {
          id: true,
          servicesName: true,
          serviceDescription: true,
          category: true,
          serviceCategory: true,
          status: true,
          modifiedAt: true,
          updater: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    const updatedServices = await this.prisma.client.$transaction(updates);

    return {
      message: `Successfully updated ${updatedServices.length} services`,
    };
  }

  async getServicesAndSubServices(input: GetAllSubServicesDto) {
    const where: Prisma.ServicesWhereInput = {
      deletedAt: null,
      status: ServiceStatus.ACTIVE,
    };

    if (input.status) {
      where.status = input.status;
    }

    if (input.category && input.category.length > 0) {
      where.category = { in: input.category };
    }

    if (input.categoryIds && input.categoryIds.length > 0) {
      where.categoryId = { in: input.categoryIds };
    }

    return this.prisma.client.services.findMany({
      where,
      select: {
        id: true,
        servicesName: true,
        serviceCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        servicesName: 'asc',
      },
    });
  }
}
