import { caslSubjects, getAbilityFilters } from '@app/ability';
import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput, getSortInput, RequestUser } from '@app/shared';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BackgroundJobStatuses,
  ClientProperties,
  ClientTypes,
  ContractStatuses,
  JobTypes,
  Prisma,
  TenantTypes,
} from '@prisma/client';
import { formatCurrency, formatDate } from 'src/utils/date-helpers';
import {
  generateCSV,
  generateExcel,
  generatePDF,
} from 'src/utils/file-export-utils';
import { ClientsService } from '../clients/clients.service';
import { PermissionType } from '../permissions/dto/permissions.entity';
import { GetServicesDto } from '../services/dto/get-service.dto';
import { GetVendorsDto } from '../vendors/dto/get-vendors.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { DateFilterType } from './dto/date-filter-type';
import { ExportFormat } from './dto/export-format-type';
import { ExportContractPropertyWiseDto } from './dto/exporty-property-wise.dto';
import { GetContractPropertyWiseDto } from './dto/get-contract-property-wise.dto';
import { GetContractDto } from './dto/get-contract.dto';
import { GetPropertyDtoContract } from './dto/get-property-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UpdatePendingConnexusDto } from './dto/update-pending-connexus.dto';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaClientService,
    private readonly clientsService: ClientsService,
  ) {}

  async create(createContractDto: CreateContractDto, user: RequestUser) {
    return this.prisma.client.$transaction(async (tx) => {
      // Get all properties with their client info
      const propertiesWithClients = await Promise.all(
        createContractDto.propertyContracts.map(async (property) => {
          const propertyFound = await tx.clientProperties.findUnique({
            where: { id: property.propertyId },
            include: { client: true },
          });

          if (!propertyFound) {
            throw new NotFoundException(
              `Property with ID ${property.propertyId} not found`,
            );
          }

          return propertyFound;
        }),
      );

      // Validate all properties belong to the same client
      const clientIds = [
        ...new Set(propertiesWithClients.map((p) => p.client.id)),
      ];
      if (clientIds.length > 1) {
        throw new BadRequestException(
          'All properties must belong to the same client',
        );
      }

      // Validate tenant ID matches the client's tenant
      const clientTenant = await tx.tenants.findFirst({
        where: {
          id: createContractDto.tenantId,
        },
      });

      if (!clientTenant) {
        throw new BadRequestException(
          'Invalid tenant ID - does not match the client tenant',
        );
      }

      // Validate vendor exists
      const vendor = await tx.vendors.findUnique({
        where: { id: createContractDto.vendorId },
      });

      if (!vendor) {
        throw new NotFoundException(
          `Vendor with ID ${createContractDto.vendorId} not found`,
        );
      }

      // Create contract data object
      const contractData = {
        contractType: createContractDto.contractType,
        contractStartDate: createContractDto.contractStartDate,
        contractEndDate: createContractDto.contractEndDate,
        contractExecution: createContractDto.contractExecution,
        costPerUnit: createContractDto.costPerUnit,
        annualContractValue: createContractDto.annualContractValue,
        contractTotalTerm: createContractDto.contractTotalTerm,
        endTermTermination: createContractDto.endTermTermination,
        earlyTerminationFee: createContractDto.earlyTerminationFee,
        renewalDuration: createContractDto.renewalDuration,
        notes: createContractDto.notes,
        contractStatus: ContractStatuses.ACTIVE,
        earlyTerminationRequirements:
          createContractDto.earlyTerminationRequirements,
        noticeRequirements: createContractDto.noticeRequirements,
        renewalTerms: createContractDto.renewalTerms,
        createdBy: { connect: { id: user.connexus_user_id } },
        modifiedBy: { connect: { id: user.connexus_user_id } },
        vendor: { connect: { id: createContractDto.vendorId } },
      };

      // Create contract first
      const createdContract = await tx.contracts.create({
        data: contractData,
      });

      // Create property contracts for each property
      const createdPropertyContracts = await Promise.all(
        propertiesWithClients.map(async (property) => {
          const unitCount = this.getUnitCount(property, property.client.type);
          const costPerUnit =
            unitCount > 0
              ? createContractDto.annualContractValue / unitCount
              : createContractDto.costPerUnit || 0;

          return tx.propertyContracts.create({
            data: {
              property: { connect: { id: property.id } },
              contract: { connect: { id: createdContract.id } },
              createdBy: { connect: { id: user.connexus_user_id } },
              modifiedBy: { connect: { id: user.connexus_user_id } },
              costPerUnit,
            },
          });
        }),
      );

      // Create property contract services for each property contract
      await Promise.all(
        createdPropertyContracts.map(async (propertyContract) => {
          return Promise.all(
            createContractDto.contractServices.map(async (service) => {
              return tx.propertyContractServices.create({
                data: {
                  contract: { connect: { id: createdContract.id } },
                  propertyContact: { connect: { id: propertyContract.id } },
                  service: { connect: { id: service.serviceId } },
                  createdBy: { connect: { id: user.connexus_user_id } },
                  modifiedBy: { connect: { id: user.connexus_user_id } },
                  baseServiceCost: createContractDto.annualContractValue,
                },
              });
            }),
          );
        }),
      );

      let fileId = null;

      if (createContractDto.response) {
        const fileDetails = await tx.fileDetails.create({
          data: {
            filePath: createContractDto.response,
            fileHash: createContractDto.fileHash,
            fileName:
              createContractDto.fileName ||
              createContractDto.response.split('___').pop(),
          },
        });
        fileId = fileDetails.id;
      }

      await tx.backgroundJobs.create({
        data: {
          jobType: JobTypes.AI_CONTRACT_PROCESSING,
          response: createContractDto.response,
          fileDetail: fileId ? { connect: { id: fileId } } : undefined,
          createdBy: { connect: { id: user.connexus_user_id } },
          tenant: { connect: { id: createContractDto.tenantId } },
          modifiedBy: { connect: { id: user.connexus_user_id } },
          resultId: createdContract.id,
          status: BackgroundJobStatuses.COMPLETED,
        },
        include: {
          fileDetail: true,
        },
      });

      return createdContract;
    });
  }

  async findAll(input: GetContractDto, user: RequestUser) {
    const where: Prisma.ContractsWhereInput = {
      deletedAt: null,
      ...(input.contractType && { contractType: input.contractType }),
      ...(input.search && {
        OR: [
          {
            contractServices: {
              some: {
                service: {
                  servicesName: { contains: input.search, mode: 'insensitive' },
                },
              },
            },
          },
          {
            propertyContracts: {
              some: {
                property: {
                  name: { contains: input.search, mode: 'insensitive' },
                },
              },
            },
          },
        ],
      }),
    };

    const sort = getSortInput({
      modelName: 'Contracts',
      sort: input.sort,
      sortDirection: input.sortDirection,
      defaultSort: 'createdAt',
    });

    const [data, pagination] = await this.prisma.client.contracts
      .paginate({
        where: getAbilityFilters({
          condition: where,
          user,
          subject: caslSubjects.Contract,
        }),
        select: {
          id: true,
          contractType: true,
          contractStartDate: true,
          contractEndDate: true,
          contractExecution: true,
          costPerUnit: true,
          annualContractValue: true,
          contractTotalTerm: true,
          endTermTermination: true,
          earlyTerminationFee: true,
          earlyTerminationRequirements: true,
          noticeRequirements: true,
          renewalTerms: true,
          notes: true,
          aiExtractedData: true,
          contractServices: {
            select: { service: { select: { id: true, servicesName: true } } },
          },
          regularTerminationNotice: true,
          renewalDuration: true,
          contractStatus: true,
          vendorId: true,
          vendor: { select: { id: true, name: true } },
          propertyContracts: {
            select: {
              property: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  state: { select: { id: true, stateName: true } },
                  city: { select: { id: true, cityName: true } },
                },
              },
            },
          },
        },
        orderBy: sort,
      })
      .withPages(getPaginationInput({ limit: input.limit, page: input.page }));

    return { data, pagination };
  }

  getUnits(type: ClientTypes): string {
    switch (type) {
      case ClientTypes.HOA:
        return 'doors';
      case ClientTypes.MULTI_FAMILY:
        return 'units';
      case ClientTypes.RETAIL:
      case ClientTypes.COMMERCIAL:
        return 'Gross Square Footage';
      case ClientTypes.STUDENT_HOUSING:
        return 'beds';
      case ClientTypes.HOTEL:
      default:
        return '';
    }
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

  async findAllPropertyWise(
    input: GetContractPropertyWiseDto,
    user: RequestUser,
  ) {
    const { where } = await this.buildPropertyWiseWhereClause(input, user);

    const [data, pagination] = await this.prisma.client.propertyContracts
      .paginate({
        where,
        select: this.getPropertyWiseSelectFields(),
        orderBy: getSortInput({
          modelName: 'PropertyContracts',
          sort: input.sort,
          sortDirection: input.sortDirection,
          defaultSort: 'createdAt',
        }),
      })
      .withPages(getPaginationInput({ limit: input.limit, page: input.page }));

    if (!data.length) {
      return { data: [], pagination };
    }

    const contractIds = data.map((pc) => pc.contract.id);

    const backgroundJobs = await this.prisma.client.backgroundJobs.findMany({
      where: {
        jobType: 'AI_CONTRACT_PROCESSING',
        status: 'COMPLETED',
        resultId: { in: contractIds },
      },
      select: { resultId: true, response: true },
    });

    const backgroundJobsMap = new Map(
      backgroundJobs.map((job) => [job.resultId, { response: job.response }]),
    );

    const transformedData = data.map((propertyContract) => {
      const jobData = backgroundJobsMap.get(propertyContract.contract.id);
      const unitName = this.getUnits(propertyContract.property.client.type);
      const annualContractValue =
        propertyContract.PropertyContractServices.reduce(
          (sum, service) => sum + (service.baseServiceCost || 0),
          0,
        );

      return {
        ...propertyContract.contract,
        propertyContractId: propertyContract.id,
        costPerUnit: propertyContract.costPerUnit,
        unitName,
        annualContractValue,
        filePath: jobData?.response || null,
        clientName: propertyContract.property.client.legalName,
        // legalName: propertyContract.property.client.legalName,
        property: {
          ...propertyContract.property,
          services: propertyContract.PropertyContractServices.map(
            (pcs) => pcs.service,
          ),
        },
      };
    });

    return { data: transformedData, pagination };
  }

  async findOnePropertyWise(id: string) {
    const propertyContract =
      await this.prisma.client.propertyContracts.findFirst({
        where: { id, deletedAt: null, contract: { deletedAt: null } },
        select: this.getPropertyWiseSelectFields(),
      });

    if (!propertyContract) {
      throw new NotFoundException(`Property contract not found with id: ${id}`);
    }

    const jobData = await this.prisma.client.backgroundJobs.findFirst({
      where: {
        jobType: 'AI_CONTRACT_PROCESSING',
        status: 'COMPLETED',
        resultId: propertyContract.contract.id,
      },
      select: { response: true },
    });

    const unitName = this.getUnits(propertyContract.property.client.type);
    const annualContractValue =
      propertyContract.PropertyContractServices.reduce(
        (sum, service) => sum + (service.baseServiceCost || 0),
        0,
      );

    return {
      ...propertyContract.contract,
      propertyContractId: propertyContract.id,
      costPerUnit: propertyContract.costPerUnit,
      unitName,
      clientId: propertyContract.property.client.id,
      annualContractValue,
      filePath: jobData?.response || null,
      clientName: propertyContract.property.client.legalName,
      property: {
        ...propertyContract.property,
        services: propertyContract.PropertyContractServices.map(
          (pcs) => pcs.service,
        ),
      },
    };
  }

  async exportAllPropertyWise({
    input,
    user,
  }: {
    input: ExportContractPropertyWiseDto;
    user: RequestUser;
  }): Promise<Buffer> {
    const { where } = await this.buildPropertyWiseWhereClause(input, user);

    const data = await this.prisma.client.propertyContracts.findMany({
      where,
      select: this.getPropertyWiseSelectFields(),
      orderBy: { createdAt: 'desc' },
    });

    if (data.length === 0) {
      throw new NotFoundException('No data available to export');
    }

    const transformedData = data.map((propertyContract) => {
      const annualContractValue =
        propertyContract.PropertyContractServices.reduce(
          (sum, service) => sum + (service.baseServiceCost || 0),
          0,
        );
      const unitName = this.getUnits(propertyContract.property.client.type);

      return {
        'Property Name': propertyContract.property.name,
        'Client Name': propertyContract.property.client.legalName,
        Services: (() => {
          if (!propertyContract?.PropertyContractServices?.length) {
            return 'N/A';
          }

          const serviceNames = propertyContract.PropertyContractServices.map(
            (pcs) => pcs?.service?.servicesName,
          ).filter((name) => name != null && name !== '');

          return serviceNames.length > 0 ? serviceNames.join(', ') : 'N/A';
        })(),
        City: propertyContract.property.city?.cityName || 'N/A',
        State: propertyContract.property.state?.stateName || 'N/A',
        'Annual Value':
          annualContractValue > 0 ? formatCurrency(annualContractValue) : 'N/A',
        'Cost/Unit/Year': `${propertyContract.costPerUnit === null ? 'N/A' : formatCurrency(propertyContract.costPerUnit)}${unitName ? ` per ${unitName}` : ''}`,
        'Vendor Name': propertyContract.contract.vendor.name || 'N/A',
        'Contract Start Date': propertyContract.contract.contractStartDate
          ? formatDate(propertyContract.contract.contractStartDate)
          : 'N/A',
        'Contract End Date': propertyContract.contract.contractEndDate
          ? formatDate(propertyContract.contract.contractEndDate)
          : 'N/A',
        'Renewal Term': propertyContract.contract.renewalDuration || 'N/A',
        'Total Term': propertyContract.contract.contractTotalTerm || 'N/A',
        'Notice Requirements':
          propertyContract.contract.noticeRequirements || 'N/A',
        'Renewal Terms': propertyContract.contract.renewalTerms || 'N/A',
        'Early Termination Fee':
          `$${propertyContract.contract.earlyTerminationFee}` || 'N/A',
        'Early Termination Requirements': propertyContract.contract
          .earlyTerminationRequirements
          ? propertyContract.contract.earlyTerminationRequirements
              .toString()
              .replace('\n', ' ')
          : 'N/A',
      };
    });

    const format = input.format || ExportFormat.XLSX;

    switch (format) {
      case ExportFormat.CSV:
        return generateCSV(transformedData);
      case ExportFormat.PDF:
        return generatePDF(transformedData);
      default:
        return generateExcel(transformedData);
    }
  }

  async getUserProfile(user: RequestUser) {
    return this.prisma.client.users.findFirst({
      where: { id: user.connexus_user_id, deletedAt: null },
      select: {
        id: true,
        userRoles: {
          select: {
            role: { select: { id: true, name: true, roleLevel: true } },
          },
        },
        userTenants: {
          // where: { tenantUserFilterType: 'CLIENT' },
          select: { tenant: { select: { id: true, clientId: true } } },
        },
      },
    });
  }

  private async buildPropertyWiseWhereClause(
    input: GetContractPropertyWiseDto | ExportContractPropertyWiseDto,
    user: RequestUser,
  ) {
    const userProfile = await this.getUserProfile(user);
    const userWorkspace = await this.clientsService.getWorkSpaces(user);

    let allowedTenantIds: string[] = [];

    if (user.user_type === PermissionType.connexus) {
      allowedTenantIds = userProfile.userTenants.map(
        (tenant) => tenant.tenant.id,
      );
    } else if (userWorkspace) {
      allowedTenantIds = [userWorkspace.tenantId];
      if (
        userWorkspace.tenant.childTenants &&
        userWorkspace.tenant.childTenants.length > 0
      ) {
        const childTenantIds = userWorkspace.tenant.childTenants.map(
          (child) => child.id,
        );
        allowedTenantIds.push(...childTenantIds);
      }
    } else {
      allowedTenantIds = [user.tenant_id];
    }

    let filteredTenantIds: string[] = [];
    if (input.clientIds && input.clientIds.length > 0) {
      const clientTenants = await this.prisma.client.tenants.findMany({
        where: {
          clientId: { in: input.clientIds },
          deletedAt: null,
        },
        select: {
          id: true,
          clientId: true,
        },
      });

      const clientMappedTenantIds = clientTenants.map((tenant) => tenant.id);
      filteredTenantIds = clientMappedTenantIds.filter((tenantId) =>
        allowedTenantIds.includes(tenantId),
      );
    } else {
      filteredTenantIds = allowedTenantIds;
    }

    const baseContractWhere: Prisma.ContractsWhereInput = {
      deletedAt: null,
      vendorId: { not: null },
      contractStatus: ContractStatuses.ACTIVE,
      ...(input.vendorIds && { vendorId: { in: input.vendorIds } }),
      ...(input.annualContractValue && {
        annualContractValue: this.addNumericRangeFilter(
          input.annualContractValue,
        ),
      }),
      ...(input.renewalDuration &&
        input.renewalDuration !== '' && {
          renewalDuration: {
            contains: input.renewalDuration,
            mode: 'insensitive',
          },
        }),
      ...(input.contractTotalTerm &&
        input.contractTotalTerm !== '' && {
          contractTotalTerm: {
            contains: input.contractTotalTerm,
            mode: 'insensitive',
          },
        }),
      ...(input.contractType && { contractType: input.contractType }),
      ...(input.contractStartDate && {
        contractStartDate: (() => {
          switch (input.contractStartDateFilter) {
            case DateFilterType.BEFORE:
              return { lte: new Date(input.contractStartDate) };
            case DateFilterType.AFTER:
              return { gte: new Date(input.contractStartDate) };
            default:
              return {
                gte: new Date(
                  new Date(input.contractStartDate).setHours(0, 0, 0, 0),
                ),
                lt: new Date(
                  new Date(input.contractStartDate).setHours(24, 0, 0, -1),
                ),
              };
          }
        })(),
      }),
      ...(input.contractEndDate && {
        contractEndDate: (() => {
          switch (input.contractEndDateFilter) {
            case DateFilterType.BEFORE:
              return { lte: new Date(input.contractEndDate) };
            case DateFilterType.AFTER:
              return { gte: new Date(input.contractEndDate) };
            default:
              return {
                gte: new Date(
                  new Date(input.contractEndDate).setHours(0, 0, 0, 0),
                ),
                lt: new Date(
                  new Date(input.contractEndDate).setHours(24, 0, 0, -1),
                ),
              };
          }
        })(),
      }),
    };

    const propertyFilters = {
      ...(input.propertyIds && { id: { in: input.propertyIds } }),
      ...(input.clientIds && { clientId: { in: input.clientIds } }),
      ...(input.cityIds && { cityId: { in: input.cityIds } }),
      ...(input.stateIds && { stateId: { in: input.stateIds } }),
      ...(filteredTenantIds.length > 0 && {
        tenantId: { in: filteredTenantIds },
      }),
    };

    const propertyWhere: Prisma.ClientPropertiesWhereInput = {
      ...propertyFilters,
      ...(input.search && {
        OR: [
          { name: { contains: input.search, mode: 'insensitive' } },
          { legalName: { contains: input.search, mode: 'insensitive' } },
        ],
      }),
    };

    const where: Prisma.PropertyContractsWhereInput = {
      deletedAt: null,
      propertyId: { not: null },
      contract: baseContractWhere,
      property: propertyWhere,
      ...(input.serviceIds && {
        PropertyContractServices: {
          some: { serviceId: { in: input.serviceIds }, deletedAt: null },
        },
      }),
      ...(input.costPerUnit && {
        costPerUnit: this.addNumericRangeFilter(input.costPerUnit),
      }),
    };

    return { where };
  }

  addNumericRangeFilter = (value, precision = 2) => {
    if (value === undefined || value === null || value === '') {
      return undefined; // Return undefined so it won't be included in the object
    }

    const numValue = Number(value);
    const epsilon = 0.5 / 10 ** precision; // Precision-based tolerance

    return {
      gte: numValue - epsilon,
      lt: numValue + epsilon,
    };
  };

  private getPropertyWiseSelectFields() {
    return {
      id: true,
      costPerUnit: true,
      property: {
        select: {
          id: true,
          name: true,
          status: true,
          client: {
            select: { id: true, name: true, legalName: true, type: true },
          },
          state: { select: { id: true, stateName: true } },
          city: { select: { id: true, cityName: true } },
        },
      },
      contract: {
        select: {
          id: true,
          contractType: true,
          contractStartDate: true,
          contractEndDate: true,
          contractExecution: true,
          annualContractValue: true,
          contractTotalTerm: true,
          endTermTermination: true,
          earlyTerminationFee: true,
          earlyTerminationRequirements: true,
          noticeRequirements: true,
          renewalTerms: true,
          regularTerminationNotice: true,
          renewalDuration: true,
          contractStatus: true,
          notes: true,
          vendor: { select: { id: true, name: true } },
        },
      },
      PropertyContractServices: {
        select: {
          baseServiceCost: true,
          service: { select: { id: true, servicesName: true } },
        },
      },
    };
  }

  async findOne(id: string, user: RequestUser) {
    // Find background job to get tenant ID
    const backgroundJob = await this.prisma.client.backgroundJobs.findFirst({
      where: {
        resultId: id,
        jobType: 'AI_CONTRACT_PROCESSING',
      },
      select: {
        tenant: {
          select: {
            clientId: true,
            name: true,
          },
        },
      },
    });

    const contract = await this.prisma.client.contracts.findFirst({
      where: getAbilityFilters({
        condition: { id, deletedAt: null },
        user,
        subject: caslSubjects.Contract,
      }),
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    const { vendorId, aiExtractedData, ...contractData } = contract;
    return {
      ...contractData,
      client: {
        id: backgroundJob?.tenant?.clientId,
        name: backgroundJob?.tenant?.name,
      },
    };
  }

  async update(
    id: string,
    updateContractDto: UpdateContractDto,
    user: RequestUser,
  ) {
    await this.findOne(id, user);

    try {
      // Use a transaction to ensure all updates are atomic
      return await this.prisma.client.$transaction(async (prisma) => {
        await prisma.contracts.update({
          where: { id },
          data: {
            contractType: updateContractDto.contractType,
            contractStartDate: updateContractDto.contractStartDate,
            contractEndDate: updateContractDto.contractEndDate,
            contractExecution: updateContractDto.contractExecution,
            contractTotalTerm: updateContractDto.contractTotalTerm,
            endTermTermination: updateContractDto.endTermTermination,
            earlyTerminationFee: updateContractDto.earlyTerminationFee,
            earlyTerminationRequirements:
              updateContractDto.earlyTerminationRequirements,
            noticeRequirements: updateContractDto.noticeRequirements,
            renewalTerms: updateContractDto.renewalTerms,
            contractStatus: updateContractDto.contractStatus,
            renewalDuration: updateContractDto.renewalDuration,
            vendorId: updateContractDto.vendorId,
            modifiedById: user.connexus_user_id,
            notes: updateContractDto.notes,
          },
        });

        let propertyContract = null;
        if (
          updateContractDto.propertyId &&
          updateContractDto.propertyContractId
        ) {
          const existingPropertyContract =
            await prisma.propertyContracts.findUnique({
              where: {
                id: updateContractDto.propertyContractId,
                contractId: id,
                deletedAt: null,
              },
            });

          if (!existingPropertyContract) {
            throw new NotFoundException(
              `Property contract with ID ${updateContractDto.propertyContractId} not found for this contract`,
            );
          }

          const property = await prisma.clientProperties.findUnique({
            where: { id: updateContractDto.propertyId },
            include: { client: true },
          });

          if (!property) {
            throw new NotFoundException(
              `Property with ID ${updateContractDto.propertyId} not found`,
            );
          }

          // Calculate unit count for the new property
          const unitCount = this.getUnitCount(property, property.client.type);

          // Get all services for this property contract to calculate costPerUnit
          const propertyContractServices =
            await prisma.propertyContractServices.findMany({
              where: {
                propertyContractId: updateContractDto.propertyContractId,
                contractId: id,
                deletedAt: null,
              },
            });

          const annualValue = propertyContractServices.reduce(
            (sum, service) => sum + (service.baseServiceCost || 0),
            0,
          );

          const costPerUnit = unitCount > 0 ? annualValue / unitCount : 0;

          propertyContract = await prisma.propertyContracts.update({
            where: { id: updateContractDto.propertyContractId },
            data: {
              propertyId: updateContractDto.propertyId,
              costPerUnit,
              modifiedById: user.connexus_user_id,
            },
            include: { property: { include: { client: true } } },
          });
        } else if (updateContractDto.propertyContractId) {
          // If we need propertyContract for later calculations but not updating the property itself
          propertyContract = await prisma.propertyContracts.findFirst({
            where: {
              id: updateContractDto.propertyContractId,
              contractId: id,
              deletedAt: null,
            },
            include: { property: { include: { client: true } } },
          });

          if (!propertyContract) {
            throw new NotFoundException(
              `Property contract with ID ${updateContractDto.propertyContractId} not found for this contract`,
            );
          }
        }

        // 3. Handle service updates
        let propertyContractServices = [];
        if (
          updateContractDto.serviceId &&
          updateContractDto.propertyContractId
        ) {
          const existingService =
            await prisma.propertyContractServices.findFirst({
              where: {
                propertyContractId: updateContractDto.propertyContractId,
                contractId: id,
                deletedAt: null,
              },
            });

          const service = await prisma.services.findUnique({
            where: { id: updateContractDto.serviceId },
          });

          if (!service) {
            throw new NotFoundException(
              `Service with ID ${updateContractDto.serviceId} not found`,
            );
          }

          if (!existingService) {
            await prisma.propertyContractServices.create({
              data: {
                contractId: id,
                propertyContractId: updateContractDto.propertyContractId,
                serviceId: updateContractDto.serviceId,
                extractedServiceName: service.servicesName,
                createdById: user.connexus_user_id,
              },
            });
          } else {
            await prisma.propertyContractServices.update({
              where: { id: existingService.id },
              data: {
                serviceId: updateContractDto.serviceId,
                modifiedById: user.connexus_user_id,
              },
            });
          }

          // Refresh our list of services after the update
          propertyContractServices =
            await prisma.propertyContractServices.findMany({
              where: {
                propertyContractId: updateContractDto.propertyContractId,
                contractId: id,
                deletedAt: null,
              },
            });
        } else if (updateContractDto.annualContractValue !== undefined) {
          // Load services if we need them for annualContractValue but didn't load them yet
          propertyContractServices =
            await prisma.propertyContractServices.findMany({
              where: {
                propertyContractId: updateContractDto.propertyContractId,
                contractId: id,
                deletedAt: null,
              },
            });
        }

        // 4. Handle annual contract value updates
        if (
          updateContractDto.annualContractValue !== undefined &&
          updateContractDto.annualContractValue !== null &&
          updateContractDto.annualContractValue > 0
        ) {
          if (!updateContractDto.propertyContractId) {
            throw new BadRequestException(
              'propertyContractId is required when updating annualContractValue',
            );
          }

          if (!propertyContract) {
            throw new NotFoundException(
              `Property contract with ID ${updateContractDto.propertyContractId} not found for this contract`,
            );
          }

          const unitCount = this.getUnitCount(
            propertyContract.property,
            propertyContract.property.client.type,
          );

          if (propertyContractServices.length === 0) {
            throw new NotFoundException(
              `No services found for property contract with ID ${updateContractDto.propertyContractId}`,
            );
          }

          // Calculate the cost per service and update each service
          const baseServiceCostPerService =
            updateContractDto.annualContractValue /
            propertyContractServices.length;

          // Update each service individually to avoid race conditions
          await Promise.all(
            propertyContractServices.map((service) =>
              prisma.propertyContractServices.update({
                where: { id: service.id },
                data: {
                  baseServiceCost: baseServiceCostPerService,
                  modifiedById: user.connexus_user_id,
                },
              }),
            ),
          );

          // Update property contract with calculated costPerUnit
          await prisma.propertyContracts.update({
            where: { id: updateContractDto.propertyContractId },
            data: {
              costPerUnit:
                unitCount > 0
                  ? updateContractDto.annualContractValue / unitCount
                  : 0,
              modifiedById: user.connexus_user_id,
            },
          });
        }

        return this.getUpdatedContractDetails(id, prisma);
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2034') {
        throw new BadRequestException('Too Many Requests');
      }
      throw error;
    }
  }

  async updatePendingConnexus(
    id: string,
    updatePendingConnexusDto: UpdatePendingConnexusDto,
    user: RequestUser,
  ) {
    // First verify the contract exists and user has access
    await this.findOne(id, user);

    try {
      return await this.prisma.client.$transaction(async (prisma) => {
        // 1. Update contract details - optimized approach
        const contractFields = [
          'contractType',
          'contractStartDate',
          'contractEndDate',
          'contractExecution',
          'contractTotalTerm',
          'endTermTermination',
          'earlyTerminationFee',
          'earlyTerminationRequirements',
          'noticeRequirements',
          'renewalTerms',
          'contractStatus',
          'renewalDuration',
          'vendorId',
          'notes',
        ];

        const contractUpdateData = contractFields.reduce((acc, field) => {
          if (updatePendingConnexusDto[field] !== undefined) {
            acc[field] = updatePendingConnexusDto[field];
          }
          return acc;
        }, {} as any);

        // Add modifiedById to all updates
        contractUpdateData.modifiedById = user.connexus_user_id;

        // Update contract if there are changes
        if (Object.keys(contractUpdateData).length > 1) {
          // More than just modifiedById
          await prisma.contracts.update({
            where: { id },
            data: contractUpdateData,
          });
        }

        // 5. Create new property contracts if provided
        const createdPropertyContracts = [];
        if (updatePendingConnexusDto.newPropertyContracts?.length > 0) {
          const newPropertyContracts = await this.createNewPropertyContracts(
            prisma,
            id,
            updatePendingConnexusDto,
            user,
          );
          createdPropertyContracts.push(...newPropertyContracts);
        }

        // 6. Create new property contract services if provided
        if (updatePendingConnexusDto.newContractServices?.length > 0) {
          await this.createNewContractServices(
            prisma,
            id,
            createdPropertyContracts[0].id,
            updatePendingConnexusDto,
            user,
          );
        }

        // Update background job status to COMPLETED
        await prisma.backgroundJobs.update({
          where: {
            id: updatePendingConnexusDto.backgroundJobId,
            jobType: JobTypes.AI_CONTRACT_PROCESSING,
          },
          data: {
            status: BackgroundJobStatuses.COMPLETED,
            modifiedBy: { connect: { id: user.connexus_user_id } },
          },
        });

        return this.getUpdatedContractDetails(id, prisma);
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2034') {
        throw new BadRequestException('Too Many Requests');
      }
      throw error;
    }
  }

  // Helper method for creating new property contracts
  private async createNewPropertyContracts(
    prisma: any,
    contractId: string,
    updateDto: UpdatePendingConnexusDto,
    user: RequestUser,
  ) {
    // Get all properties with their client info
    const propertiesWithClients = await Promise.all(
      updateDto.newPropertyContracts.map(async (property) => {
        const propertyFound = await prisma.clientProperties.findUnique({
          where: { id: property.propertyId },
          include: { client: true },
        });

        if (!propertyFound) {
          throw new NotFoundException(
            `Property with ID ${property.propertyId} not found`,
          );
        }

        return propertyFound;
      }),
    );

    // Validate all properties belong to the same client
    const clientIds = [
      ...new Set(propertiesWithClients.map((p) => p.client.id)),
    ];
    if (clientIds.length > 1) {
      throw new BadRequestException(
        'All properties must belong to the same client',
      );
    }

    // Check for existing property contracts to avoid duplicates
    const existingPropertyContracts = await Promise.all(
      propertiesWithClients.map(async (property) => {
        const existingPropertyContract =
          await prisma.propertyContracts.findFirst({
            where: {
              contractId,
              propertyId: property.id,
              deletedAt: null,
            },
          });

        if (existingPropertyContract) {
          throw new BadRequestException(
            `Property contract already exists for property ${property.id}`,
          );
        }

        return property;
      }),
    );

    // Create new property contracts
    return Promise.all(
      existingPropertyContracts.map(async (property) => {
        const unitCount = this.getUnitCount(property, property.client.type);
        const costPerUnit =
          unitCount > 0
            ? (updateDto.annualContractValue || 0) / unitCount
            : updateDto.costPerUnit || 0;

        return prisma.propertyContracts.create({
          data: {
            property: { connect: { id: property.id } },
            contract: { connect: { id: contractId } },
            createdBy: { connect: { id: user.connexus_user_id } },
            modifiedBy: { connect: { id: user.connexus_user_id } },
            costPerUnit,
          },
        });
      }),
    );
  }

  // Helper method for creating new contract services
  private async createNewContractServices(
    prisma: any,
    contractId: string,
    propertyContractId: string,
    updateDto: UpdatePendingConnexusDto,
    user: RequestUser,
  ) {
    await Promise.all(
      updateDto.newContractServices.map(async (serviceData) => {
        // Validate property contract exists
        const existingPropertyContract =
          await prisma.propertyContracts.findFirst({
            where: {
              id: propertyContractId,
              contractId,
              deletedAt: null,
            },
          });

        if (!existingPropertyContract) {
          throw new NotFoundException(
            `Property contract with ID ${propertyContractId} not found for this contract`,
          );
        }

        // Validate service exists
        const service = await prisma.services.findUnique({
          where: { id: serviceData.serviceId },
        });

        if (!service) {
          throw new NotFoundException(
            `Service with ID ${serviceData.serviceId} not found`,
          );
        }

        // Create new property contract service
        await prisma.propertyContractServices.create({
          data: {
            contract: { connect: { id: contractId } },
            propertyContact: { connect: { id: propertyContractId } },
            service: { connect: { id: serviceData.serviceId } },
            createdBy: { connect: { id: user.connexus_user_id } },
            modifiedBy: { connect: { id: user.connexus_user_id } },
            baseServiceCost: updateDto.annualContractValue || 0,
          },
        });
      }),
    );
  }

  private async getUpdatedContractDetails(contractId: string, prisma: any) {
    return prisma.contracts.findUnique({
      where: { id: contractId },
      include: {
        propertyContracts: {
          where: { deletedAt: null },
          include: {
            property: { select: { id: true, name: true, unitCount: true } },
            PropertyContractServices: {
              where: { deletedAt: null },
              include: {
                service: { select: { id: true, servicesName: true } },
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string, user: RequestUser) {
    await this.findOne(id, user);

    await this.prisma.client.contracts.update({
      where: { id },
      data: { deletedAt: new Date(), modifiedById: user.connexus_user_id },
    });

    return { message: 'Contract deleted successfully' };
  }

  async findVendors(input: GetVendorsDto, user: RequestUser) {
    try {
      const where: Prisma.VendorsWhereInput = {
        ...(input.stage && { stage: input.stage }),
        ...(input.vendorUnion && { vendorUnion: input.vendorUnion }),
        ...(input.tenantId && { tenantId: input.tenantId }),
        ...(input.vendorRegistrationType && {
          vendorRegistrationType: input.vendorRegistrationType,
        }),
      };

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { vendorLegalName: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      if (input.clientId) {
        // If approvalStatus is 'APPROVED', filter vendors that are approved for the client
        if (input.approvalStatus === 'APPROVED') {
          where.ApprovedClientVendors = {
            some: {
              clientId: input.clientId,
            },
          };
        }
        // If approvalStatus is 'NOT_APPROVED', filter vendors that are not approved for the client and not deleted
        else if (input.approvalStatus === 'NOT_APPROVED') {
          where.ClientNotApprovedVendors = {
            some: {
              clientId: input.clientId,
              isDeleted: false,
            },
          };
        }
        // If approvalStatus is not specified, exclude vendors that are not approved for the client and not deleted
        else if (!input.approvalStatus) {
          where.NOT = [
            {
              ClientNotApprovedVendors: {
                some: {
                  clientId: input.clientId,
                  isDeleted: false,
                },
              },
            },
          ];
        }
      }

      if (input.parentVendorIds?.length) {
        where.parentCompanyId = {
          in: input.parentVendorIds,
        };
      }

      if (input.tenantTypes?.length) {
        where.tenant = { type: { in: input.tenantTypes } };
      }

      if (input.serviceIds?.length) {
        where.vendorServices = {
          some: {
            serviceId: { in: input.serviceIds },
          },
        };
      }

      if (input?.status?.length) {
        where.status = { in: input.status };
      }

      if (input.registrationType) {
        where.vendorRegistrationType = input.registrationType;
      }

      if (input.hasChildren) {
        where.childCompanies = {
          some: {
            tenant: {
              type: TenantTypes.VENDOR,
            },
          },
        };
      }

      if (input.w9Attached === true) {
        where.vendorW9Url = {
          not: null,
        };
      } else if (input.w9Attached === false) {
        where.vendorW9Url = null;
      }

      if (input.coi === true) {
        where.certInsurance = {
          not: null,
        };
      } else if (input.coi === false) {
        where.certInsurance = null;
      }
      const orderBy = getSortInput({
        modelName: Prisma.ModelName.Vendors,
        sortDirection: input.sortDirection,
        sort: input.sort,
        defaultSort: 'createdAt',
        nestedSortLevel: 3,
      });

      const vendorsWhereInput = getAbilityFilters({
        user,
        condition: where,
        subject: caslSubjects.Contract,
      });

      const [data, pagination] = await this.prisma.client.vendors
        .paginate({
          where: vendorsWhereInput,
          orderBy,
          select: {
            id: true,
            name: true,
            logo: true,
            stage: true,
            address: true,
            recognition: true,
            certInsurance: true,
            note: true,
            vendorSource: true,
            vendorLegalName: true,
            vendorUnion: true,
            vendorRegistrationType: true,
            certInsuranceExpiry: true,
            vendorInsuranceCertificate: true,
            vendorInsuranceExpiry: true,
            vendorInsuranceNote: true,
            tenant: {
              select: {
                id: true,
                name: true,
                type: true,
                _count: {
                  select: {
                    userTenants: { where: { user: { deletedAt: null } } },
                  },
                },
                parentTenant: { select: { id: true, name: true } },
              },
            },
            vendorW9Url: true,
            status: true,
            city: { select: { id: true, cityName: true } },
            state: { select: { id: true, stateName: true } },
            vendorZip: true,
            vendorServiceCoverContinentalUs: true,
            vendorServices: {
              select: { service: { select: { id: true, servicesName: true } } },
            },
          },
        })
        .withPages(getPaginationInput(input));

      return { data, pagination };
    } catch (error) {
      throw new Error(`Failed to find vendors: ${error}`);
    }
  }

  async findProperties(
    getPropertyDto: GetPropertyDtoContract,
    user: RequestUser,
  ) {
    try {
      const {
        countyIds,
        cityIds,
        stateIds,
        countryIds,
        managerIds,
        clientId,
        excludeIds,
      } = getPropertyDto;

      const filters: Prisma.ClientPropertiesWhereInput = {
        ...(cityIds && cityIds.length > 0 && { cityId: { in: cityIds } }),

        ...(stateIds && stateIds.length > 0 && { stateId: { in: stateIds } }),

        ...(countryIds &&
          countryIds.length > 0 && { countryId: { in: countryIds } }),

        ...(managerIds &&
          managerIds.length > 0 && { propertyManagerId: { in: managerIds } }),

        ...(countyIds &&
          countyIds.length > 0 && { countyId: { in: countyIds } }),

        ...(clientId && { clientId }),
        ...(excludeIds &&
          excludeIds.length > 0 && { id: { notIn: excludeIds } }),
        deletedAt: null,
      };

      if (getPropertyDto.search) {
        filters.OR = [
          { name: { contains: getPropertyDto.search, mode: 'insensitive' } },
          { address: { contains: getPropertyDto.search, mode: 'insensitive' } },
          { zip: { contains: getPropertyDto.search, mode: 'insensitive' } },
        ];
      }

      if (getPropertyDto.tenantId) {
        filters.client = { tenantId: getPropertyDto.tenantId };
      }

      if (getPropertyDto.status) {
        filters.status = getPropertyDto.status;
      }

      if (getPropertyDto.type) {
        filters.type = getPropertyDto.type;
      }

      if (getPropertyDto.isRetailScope !== undefined) {
        filters.isRetailScope = getPropertyDto.isRetailScope;
      }

      if (getPropertyDto.isRetail !== undefined) {
        filters.isRetail = getPropertyDto.isRetail;
      }

      const orderBy = getSortInput({
        sort: getPropertyDto.sort,
        sortDirection: getPropertyDto.sortDirection,
        modelName: Prisma.ModelName.ClientProperties,
        defaultSort: 'createdAt',
      });

      const [data, pagination] = await this.prisma.client.clientProperties
        .paginate({
          where: getAbilityFilters({
            condition: filters,
            user,
            subject: caslSubjects.Contract,
          }),
          orderBy,
          select: {
            id: true,
            name: true,
          },
        })
        .withPages(
          getPaginationInput({
            limit: getPropertyDto.limit,
            page: getPropertyDto.page,
          }),
        );

      return { data, pagination };
    } catch (error) {
      throw new Error(`Failed to find properties: ${error}`);
    }
  }

  async findServices(input: GetServicesDto) {
    // Build base filters (excluding full-text)
    const baseWhere: Prisma.ServicesWhereInput = {
      deletedAt: null,
      ...(input.status && { status: input.status }),
      ...(input.category?.length > 0 && { category: { in: input.category } }),
      ...(input.approvedBy && {
        serviceApprovedById: { in: input.approvedBy },
      }),
    };

    let matchingIds: string[] | undefined;

    // If full-text search input exists
    if (input.search && input.search.trim() !== '') {
      const searchTerm = input.search.trim().replace(/[':]/g, ' ');
      try {
        const result = await this.prisma.client.$queryRaw<
          { id: string; rank: number }[]
        >`
        SELECT "id", ts_rank_cd("search_vector", to_tsquery('english', ${`${searchTerm}:*`})) as rank
        FROM "Services" 
        WHERE "search_vector" @@ to_tsquery('english', ${`${searchTerm}:*`})
        ORDER BY rank DESC
        LIMIT 20;
      `;
        matchingIds = result.map((r) => r.id);
      } catch (error) {
        matchingIds = [];
      }

      if (matchingIds.length > 0) {
        baseWhere.id = { in: matchingIds };
      } else {
        baseWhere.OR = [
          { servicesName: { contains: input.search, mode: 'insensitive' } },
          {
            serviceDescription: { contains: input.search, mode: 'insensitive' },
          },
        ];
      }
    }

    const [data, pagination] = await this.prisma.client.services
      .paginate({
        where: baseWhere,
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
            select: { id: true, firstName: true, lastName: true },
          },
          serviceApprovedOn: true,
          status: true,
        },
      })
      .withPages(getPaginationInput(input));

    return { data, pagination };
  }
}
