import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput, getSortInput, RequestUser } from '@app/shared';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProperties, ClientTypes, Prisma } from '@prisma/client';
import { CreatePropertyContractDto } from './dto/create-property-contract.dto';
import { GetPropertyContractsDto } from './dto/get-property-contracts.dto';
import { UpdatePropertyContractDto } from './dto/update-property-contract.dto';

@Injectable()
export class PropertyContractsService {
  constructor(private readonly prisma: PrismaClientService) {}

  async create(createDto: CreatePropertyContractDto, user: RequestUser) {
    // Check if contract exists
    const contract = await this.prisma.client.contracts.findUnique({
      where: { id: createDto.contractId },
    });

    if (!contract) {
      throw new NotFoundException(
        `Contract with ID ${createDto.contractId} not found`,
      );
    }

    // Check if property exists
    const property = await this.prisma.client.clientProperties.findUnique({
      where: { id: createDto.propertyId },
    });

    if (!property) {
      throw new NotFoundException(
        `Property with ID ${createDto.propertyId} not found`,
      );
    }

    // Check for duplicate entry
    const existingContract =
      await this.prisma.client.propertyContracts.findFirst({
        where: {
          contractId: createDto.contractId,
          propertyId: createDto.propertyId,
          deletedAt: null,
        },
      });

    if (existingContract) {
      throw new ConflictException(
        'Property contract with these details already exists',
      );
    }

    return this.prisma.client.propertyContracts.create({
      data: {
        contractId: createDto.contractId,
        propertyId: createDto.propertyId,
        createdById: user.connexus_user_id,
      },
      select: {
        id: true,
        contractId: true,
        propertyId: true,
        createdAt: true,
        contract: {
          select: { id: true, contractStartDate: true, contractEndDate: true },
        },
        property: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(input: GetPropertyContractsDto) {
    const where: Prisma.PropertyContractsWhereInput = {
      deletedAt: null,
      ...(input.contractId && { contractId: input.contractId }),
      ...(input.propertyId && { propertyId: input.propertyId }),
    };

    const [data, pagination] = await this.prisma.client.propertyContracts
      .paginate({
        where,
        orderBy: getSortInput({
          modelName: Prisma.ModelName.PropertyContracts,
          sortDirection: input.sortDirection,
          sort: input.sort,
          defaultSort: 'createdAt',
        }),
        select: {
          id: true,
          contractId: true,
          propertyId: true,
          createdAt: true,
          extractedPropertyName: true,
          contract: {
            select: {
              id: true,
              contractStartDate: true,
              contractEndDate: true,
              derivedVendorName: true,
              vendorId: true,
            },
          },
          property: { select: { id: true, name: true } },
          PropertyContractServices: {
            select: { service: { select: { id: true, servicesName: true } } },
          },
        },
      })
      .withPages(getPaginationInput(input));

    return { data, pagination };
  }

  async findOne(id: string) {
    const propertyContract =
      await this.prisma.client.propertyContracts.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          contractId: true,
          propertyId: true,
          createdAt: true,
          contract: {
            select: {
              id: true,
              contractStartDate: true,
              contractEndDate: true,
              derivedVendorName: true,
            },
          },
          property: { select: { id: true, name: true } },
        },
      });

    if (!propertyContract) {
      throw new NotFoundException(`Property contract with ID ${id} not found`);
    }

    return propertyContract;
  }

  getUnitCount(property: ClientProperties, type: ClientTypes): number {
    switch (type) {
      case ClientTypes.HOA:
        return property?.numberOfDoors || 0;
      case ClientTypes.MULTI_FAMILY:
        return property?.numberOfUnits || 0;
      case ClientTypes.RETAIL:
      case ClientTypes.COMMERCIAL:
        return property?.grossSquareFootage || 0;
      case ClientTypes.STUDENT_HOUSING:
        return property?.numberOfBeds || 0;
      case ClientTypes.HOTEL:
      default:
        return 0;
    }
  }

  async update(
    id: string,
    updateDto: UpdatePropertyContractDto,
    user: RequestUser,
  ) {
    await this.findOne(id);

    let unitCount = 0;

    if (updateDto.propertyId) {
      const property = await this.prisma.client.clientProperties.findUnique({
        where: { id: updateDto.propertyId },
        include: { client: true },
      });

      if (!property) {
        throw new NotFoundException(
          `Property with ID ${updateDto.propertyId} not found`,
        );
      }
      unitCount = this.getUnitCount(property, property.client.type);
    }

    // Get the contract and property details with related services
    const propertyContract =
      await this.prisma.client.propertyContracts.findUnique({
        where: { id },
        include: {
          contract: true,
          property: true,
          PropertyContractServices: {
            where: { deletedAt: null },
            select: { baseServiceCost: true },
          },
        },
      });

    if (!propertyContract) {
      throw new NotFoundException(`Property contract with ID ${id} not found`);
    }

    // Calculate annualContractValue by summing all baseServiceCosts
    const annualContractValue =
      propertyContract.PropertyContractServices.reduce(
        (sum, service) => sum + (service.baseServiceCost || 0),
        0,
      );

    // Calculate costPerUnit
    const costPerUnit = unitCount > 0 ? annualContractValue / unitCount : 0;

    // Then update the property contract
    return this.prisma.client.propertyContracts.update({
      where: { id },
      data: {
        propertyId: updateDto.propertyId,
        modifiedById: user.connexus_user_id,
        costPerUnit,
      },
      select: {
        id: true,
        contractId: true,
        propertyId: true,
        modifiedAt: true,
        costPerUnit: true,
        contract: {
          select: {
            id: true,
            contractStartDate: true,
            contractEndDate: true,
            annualContractValue: true,
          },
        },
        property: { select: { id: true, name: true, unitCount: true } },
      },
    });
  }

  async remove(id: string, user: RequestUser) {
    const propertyContract = await this.findOne(id);

    const backgroundJob = await this.prisma.client.backgroundJobs.findFirst({
      where: { resultId: propertyContract.contractId },
      select: { status: true },
    });

    if (!backgroundJob) {
      throw new NotFoundException(
        `Contract with ID ${propertyContract.contractId} not found`,
      );
    }

    if (backgroundJob.status !== 'PENDING_FOR_APPROVAL') {
      throw new ConflictException(
        'Cannot delete property contract: contract is not in PENDING_FOR_APPROVAL status.',
      );
    }

    const count = await this.prisma.client.propertyContracts.count({
      where: {
        contractId: propertyContract.contractId,
        deletedAt: null,
      },
    });

    if (count <= 1) {
      throw new ConflictException(
        'Cannot delete property contract: only one property exists for this contract.',
      );
    }

    await this.prisma.client.propertyContractServices.updateMany({
      where: { propertyContractId: id, deletedAt: null },
      data: { deletedAt: new Date(), modifiedById: user.connexus_user_id },
    });

    return this.prisma.client.propertyContracts.update({
      where: { id },
      data: { deletedAt: new Date(), modifiedById: user.connexus_user_id },
      select: { id: true, deletedAt: true },
    });
  }
}
