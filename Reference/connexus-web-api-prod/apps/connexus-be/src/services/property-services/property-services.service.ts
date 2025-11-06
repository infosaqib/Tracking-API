import { Actions } from '@app/ability';
import { ThrowCaslForbiddenError } from '@app/ability/helpers/casl-helpers';
import { createPropertySubject } from '@app/ability/permissions/property-management';
import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput, getSortInput, RequestUser } from '@app/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PropertyPermissionCheckInput } from '../property-contacts/dto/types';
import { CreatePropertyServiceDto } from './dto/create-property-service.dto';
import { GetPropertyServicesDto } from './dto/get-property-services.dto';

@Injectable()
export class PropertyServicesService {
  constructor(private readonly prisma: PrismaClientService) {}

  async create(
    createPropertyServiceDto: CreatePropertyServiceDto,
    user: RequestUser,
  ) {
    const { propertyId, serviceIds } = createPropertyServiceDto;

    const property =
      await this.prisma.client.clientProperties.findUniqueOrThrow({
        where: { id: propertyId },
      });

    this.checkUserHasPropertyPermission({
      property,
      user,
      action: Actions.Update,
    });

    const services = await this.prisma.client.services.findMany({
      where: { id: { in: serviceIds }, deletedAt: null },
    });

    if (services.length !== serviceIds.length) {
      throw new BadRequestException('One or more services are invalid');
    }

    const existingServices =
      await this.prisma.client.propertyServiceMap.findMany({
        where: { propertyId, serviceId: { in: serviceIds } },
        select: { service: { select: { servicesName: true } } },
      });

    if (existingServices.length > 0) {
      const existingServiceNames = existingServices
        .map((es) => es.service.servicesName)
        .join(', ');
      throw new ConflictException(
        `The following services already exist in the property: ${existingServiceNames}`,
      );
    }

    const createdServices = await this.prisma.client.$transaction(
      serviceIds.map((serviceId) =>
        this.prisma.client.propertyServiceMap.create({
          data: {
            propertyId,
            serviceId,
            creatorId: user.connexus_user_id,
            updaterId: user.connexus_user_id,
          },
        }),
      ),
    );

    return createdServices;
  }

  async findAll(input: GetPropertyServicesDto, user: RequestUser) {
    const { propertyId, serviceId, search } = input;

    const property = await this.prisma.client.clientProperties.findFirstOrThrow(
      { where: { id: propertyId, deletedAt: null } },
    );

    this.checkUserHasPropertyPermission({
      property,
      user,
      action: Actions.Read,
    });

    const where: Prisma.PropertyServiceMapWhereInput = {
      propertyId,
      ...(serviceId && { serviceId }),
      ...(search && {
        OR: [{ service: { servicesName: { contains: search } } }],
      }),
    };

    const sort = getSortInput({
      modelName: Prisma.ModelName.PropertyServiceMap,
      sort: input.sort,
      sortDirection: input.sortDirection,
      defaultSort: 'createdAt',
    });

    const [data, pagination] = await this.prisma.client.propertyServiceMap
      .paginate({
        where,
        orderBy: sort,
        select: {
          id: true,
          service: { select: { id: true, servicesName: true } },
        },
      })
      .withPages(getPaginationInput({ page: input.page, limit: input.limit }));

    return { data, pagination };
  }

  async findOne(id: string, user: RequestUser) {
    const propertyService =
      await this.prisma.client.propertyServiceMap.findUniqueOrThrow({
        where: { id },
        select: { id: true, property: true },
      });

    this.checkUserHasPropertyPermission({
      property: propertyService.property,
      user,
      action: Actions.Read,
    });

    const { property, ...rest } = propertyService;

    return rest;
  }

  async remove(id: string, user: RequestUser) {
    const propertyService =
      await this.prisma.client.propertyServiceMap.findFirstOrThrow({
        where: { id },
        include: { property: true },
      });

    this.checkUserHasPropertyPermission({
      property: propertyService.property,
      user,
      action: Actions.Delete,
    });

    await this.prisma.client.propertyServiceMap.delete({
      where: { id },
    });

    return { message: 'Service removed from property successfully' };
  }

  private checkUserHasPropertyPermission(input: PropertyPermissionCheckInput) {
    const { property, user, action } = input;
    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      action,
      createPropertySubject(property),
    );
  }
}
