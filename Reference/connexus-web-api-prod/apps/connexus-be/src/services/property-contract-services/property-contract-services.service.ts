import { PrismaService as PrismaClientService } from '@app/prisma';
import { getSortInput, RequestUser } from '@app/shared';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BulkUpdatePropertyContractServiceDto } from './dto/bulk-update-property-contract-service.dto';
import { CreatePropertyContractServiceDto } from './dto/create-property-contract-service.dto';
import { GetPropertyContractServicesDto } from './dto/get-property-contract-services.dto';
import { UpdatePropertyContractServiceDto } from './dto/update-property-contract-service.dto';

@Injectable()
export class PropertyContractServicesService {
  constructor(private readonly prisma: PrismaClientService) {}

  async create(createDto: CreatePropertyContractServiceDto, user: RequestUser) {
    // Check if contract exists
    const contract = await this.prisma.client.contracts.findUnique({
      where: { id: createDto.contractId },
    });

    if (!contract) {
      throw new NotFoundException(
        `Contract with ID ${createDto.contractId} not found`,
      );
    }

    // Check if property contract exists
    const propertyContract =
      await this.prisma.client.propertyContracts.findUnique({
        where: { id: createDto.propertyContractId },
      });

    if (!propertyContract) {
      throw new NotFoundException(
        `Property contract with ID ${createDto.propertyContractId} not found`,
      );
    }

    // Check if service exists if serviceId is provided
    if (createDto.serviceId) {
      const service = await this.prisma.client.services.findUnique({
        where: { id: createDto.serviceId },
      });

      if (!service) {
        throw new NotFoundException(
          `Service with ID ${createDto.serviceId} not found`,
        );
      }
    }

    // Check for duplicate entry
    const existingService =
      await this.prisma.client.propertyContractServices.findFirst({
        where: {
          contractId: createDto.contractId,
          propertyContractId: createDto.propertyContractId,
          serviceId: createDto.serviceId,
          deletedAt: null,
        },
      });

    if (existingService) {
      throw new ConflictException(
        'Property contract service with these details already exists',
      );
    }

    return this.prisma.client.propertyContractServices.create({
      data: {
        contractId: createDto.contractId,
        propertyContractId: createDto.propertyContractId,
        serviceId: createDto.serviceId,
        extractedServiceName: createDto.extractedServiceName,
        createdById: user.connexus_user_id,
      },
      select: {
        id: true,
        contractId: true,
        propertyContractId: true,
        serviceId: true,
        extractedServiceName: true,
        createdAt: true,
        service: {
          select: {
            id: true,
            servicesName: true,
          },
        },
      },
    });
  }

  async findAll(input: GetPropertyContractServicesDto) {
    const where: Prisma.PropertyContractServicesWhereInput = {
      deletedAt: null,
      ...(input.contractId && { contractId: input.contractId }),
      ...(input.propertyContractId && {
        propertyContractId: input.propertyContractId,
      }),
      ...(input.serviceId && { serviceId: input.serviceId }),
    };

    const data = await this.prisma.client.propertyContractServices.findMany({
      where,
      orderBy: getSortInput({
        modelName: Prisma.ModelName.PropertyContractServices,
        sortDirection: input.sortDirection,
        sort: input.sort,
        defaultSort: 'createdAt',
      }),
      select: {
        id: true,
        contractId: true,
        propertyContractId: true,
        serviceId: true,
        service: {
          select: {
            id: true,
            servicesName: true,
          },
        },
        extractedServiceName: true,
        createdAt: true,
        contract: {
          select: {
            id: true,
            contractStartDate: true,
            contractEndDate: true,
          },
        },
        propertyContact: {
          select: {
            id: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return data;
  }

  async findOne(id: string) {
    const propertyContractService =
      await this.prisma.client.propertyContractServices.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          contractId: true,
          propertyContractId: true,
          serviceId: true,
          extractedServiceName: true,
          createdAt: true,
          contract: {
            select: {
              id: true,
              contractStartDate: true,
              contractEndDate: true,
            },
          },
          service: {
            select: {
              id: true,
              servicesName: true,
            },
          },
          propertyContact: {
            select: {
              id: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

    if (!propertyContractService) {
      throw new NotFoundException(
        `Property contract service with ID ${id} not found`,
      );
    }

    return propertyContractService;
  }

  async update(
    id: string,
    updateDto: UpdatePropertyContractServiceDto,
    user: RequestUser,
  ) {
    await this.findOne(id);

    if (updateDto.serviceId) {
      const service = await this.prisma.client.services.findUnique({
        where: { id: updateDto.serviceId },
      });

      if (!service) {
        throw new NotFoundException(
          `Service with ID ${updateDto.serviceId} not found`,
        );
      }
    }

    return this.prisma.client.propertyContractServices.update({
      where: { id },
      data: {
        serviceId: updateDto.serviceId,
        modifiedById: user.connexus_user_id,
      },
      select: {
        id: true,
        contractId: true,
        propertyContractId: true,
        serviceId: true,
        extractedServiceName: true,
        modifiedAt: true,
        contract: {
          select: {
            id: true,
            contractStartDate: true,
            contractEndDate: true,
          },
        },
        service: {
          select: {
            id: true,
            servicesName: true,
          },
        },
        propertyContact: {
          select: {
            id: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string, user: RequestUser) {
    const propertyContractService = await this.findOne(id);

    // Count how many propertyContractServices exist for this propertyContract (excluding deleted)
    const count = await this.prisma.client.propertyContractServices.count({
      where: {
        propertyContractId: propertyContractService.propertyContractId,
        deletedAt: null,
      },
    });

    if (count <= 1) {
      throw new ConflictException(
        'Cannot delete property contract service: only one service exists for this property contract.',
      );
    }

    return this.prisma.client.propertyContractServices.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        modifiedById: user.connexus_user_id,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });
  }

  /**
   * Validates that all provided service IDs exist in the database
   * @param serviceIds Array of service IDs to validate
   * @throws NotFoundException if one or more services not found
   */
  private async validateServicesExist(serviceIds: string[]): Promise<void> {
    if (serviceIds.length === 0) {
      return;
    }

    const services = await this.prisma.client.services.findMany({
      where: { id: { in: serviceIds } },
    });

    if (services.length !== serviceIds.length) {
      throw new NotFoundException('One or more services not found');
    }
  }

  async bulkUpdate(
    input: BulkUpdatePropertyContractServiceDto,
    user: RequestUser,
  ) {
    // Validate all services exist
    // Create a map of propertyContractServiceId -> serviceId
    const serviceMap = new Map(
      input.input.map((item) => [item.id, item.serviceId]),
    );

    // Get all property contract services that need to be updated
    const propertyContractServiceIds = Array.from(serviceMap.keys());
    const existingServices =
      await this.prisma.client.propertyContractServices.findMany({
        where: {
          id: { in: propertyContractServiceIds },
          deletedAt: null,
        },
      });

    if (existingServices.length === 0) {
      throw new NotFoundException('No property contract services found');
    }

    // Validate all services exist
    const serviceIds = Array.from(
      new Set(Array.from(serviceMap.values()).filter(Boolean)),
    );
    await this.validateServicesExist(serviceIds);

    // Split input into updates and deletes based on serviceId
    const updateItems = input.input.filter((item) => item.serviceId);
    const deleteItems = input.input.filter((item) => !item.serviceId);

    // Build update transactions
    const updates = updateItems.map((item) =>
      this.prisma.client.propertyContractServices.update({
        where: { id: item.id },
        data: {
          serviceId: item.serviceId,
          modifiedById: user.connexus_user_id,
        },
        select: {
          id: true,
          contractId: true,
          propertyContractId: true,
          serviceId: true,
          extractedServiceName: true,
          modifiedAt: true,
          service: {
            select: {
              id: true,
              servicesName: true,
            },
          },
          propertyContact: {
            select: {
              id: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    );

    // Build delete transactions
    const deletes = deleteItems.map((item) =>
      this.prisma.client.propertyContractServices.update({
        where: { id: item.id },
        data: {
          serviceId: null,
          deletedAt: new Date(),
          modifiedById: user.connexus_user_id,
        },
        select: {
          id: true,
          contractId: true,
          propertyContractId: true,
          serviceId: true,
          extractedServiceName: true,
          modifiedAt: true,
          service: {
            select: {
              id: true,
              servicesName: true,
            },
          },
          propertyContact: {
            select: {
              id: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    );

    // Combine all transactions
    const allTransactions = [...updates, ...deletes];

    return this.prisma.client.$transaction(allTransactions);
  }
}
