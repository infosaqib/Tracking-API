import { Actions, caslSubjects, getAbilityFilters } from '@app/ability';
import { ThrowCaslForbiddenError } from '@app/ability/helpers/casl-helpers';
import { createPropertySubject } from '@app/ability/permissions/property-management';
import { ExportDataService } from '@app/export-data';
import { ExportRequestTypes } from '@app/export-data/dto';
import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput, getSortInput, RequestUser } from '@app/shared';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaPromise, TenantUserFilterTypes } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CheckUserPermissionDto } from './dto/check-user-permission';
import { CreatePropertyDto } from './dto/create-property.dto';
import { ExportPropertyDto } from './dto/export-property.dto';
import { GetPropertyDto } from './dto/get-property.dto';
import { GetSelectedPropertiesDto } from './dto/get-selected-properties.dto';
import { GetUserPropertiesDto } from './dto/get-user-properties.dto';
import { UpdatePropertyPermissionDto } from './dto/update-property-permission.dto';
import {
  UpdatePropertyDto,
  UpdatePropertyStatusDto,
} from './dto/update-property.dto';
import {
  createPropertyData,
  createServiceInput,
  createUserCreateInput,
  validateLegalName,
  validatePropertyManager,
  validateUsers,
} from './property-helpers';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prismaService: PrismaClientService,
    private readonly exportDataService: ExportDataService,
  ) {}

  logger = new Logger('PropertiesService');

  async create(createPropertyDto: CreatePropertyDto, user: RequestUser) {
    const client = await this.getClient(createPropertyDto.clientId);

    await this.validatePropertyCreation(createPropertyDto);

    const propertyId = randomUUID();
    const managerUserId = createPropertyDto.managerId || randomUUID();
    const userCreateInput = createUserCreateInput(
      createPropertyDto.users,
      user,
    );

    const serviceInput = createServiceInput(
      createPropertyDto.services,
      propertyId,
      user,
    );

    const [property] = await this.prismaService.client.$transaction(
      this.createPropertyTransactionOperations(
        createPropertyDto,
        propertyId,
        managerUserId,
        user,
        client,
        userCreateInput,
        serviceInput,
      ),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return property;
  }

  private async getClient(clientId: string) {
    const client = await this.prismaService.client.client.findUnique({
      where: { id: clientId, deletedAt: null },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  private async validatePropertyCreation(createPropertyDto: CreatePropertyDto) {
    const [propertyManagerResult, legalNameResult, usersResult] =
      await Promise.allSettled([
        validatePropertyManager(this.prismaService, {
          managerEmail: createPropertyDto.managerEmail,
          managerUserId: createPropertyDto.managerId,
        }),
        validateLegalName(this.prismaService, createPropertyDto.legalName),
        validateUsers(this.prismaService, createPropertyDto.users),
      ]);

    const errors: string[] = [
      propertyManagerResult.status === 'rejected'
        ? propertyManagerResult.reason.message
        : '',
      legalNameResult.status === 'rejected'
        ? legalNameResult.reason.message
        : '',
      usersResult.status === 'rejected' ? usersResult.reason.message : '',
    ].filter((error) => error !== '');

    if (errors.length > 0) {
      throw new ConflictException(errors.join(' \n'));
    }
  }

  private createPropertyTransactionOperations(
    createPropertyDto: CreatePropertyDto,
    propertyId: string,
    managerUserId: string,
    user: RequestUser,
    client: any,
    userCreateInput: Prisma.UsersCreateInput[],
    serviceInput: Prisma.PropertyServiceMapCreateManyInput[],
  ) {
    const propertyData = createPropertyData({
      createPropertyDto,
      propertyId,
      managerUserId,
      user,
      client,
    });

    const transactions: PrismaPromise<any>[] = [
      this.prismaService.client.clientProperties.create({
        data: propertyData,
        select: {
          id: true,
          name: true,
          legalName: true,
          website: true,
          address: true,
          zip: true,
          tenantId: true,
        },
      }),
    ];

    if (userCreateInput.length > 0) {
      transactions.push(
        this.prismaService.client.users.createMany({ data: userCreateInput }),
      );

      // Add to property contacts
      transactions.push(
        this.prismaService.client.propertyContacts.createMany({
          data: userCreateInput.map((u) => ({
            userId: u.id,
            propertyId,
            creatorId: u.id,
            updaterId: u.id,
          })),
        }),
      );

      // Create user tenants
      transactions.push(
        this.prismaService.client.userTenants.createMany({
          data: userCreateInput.map((u) => ({
            tenantId: client.tenantId,
            userId: u.id,
            tenantUserFilterType: TenantUserFilterTypes.PROPERTY,
            createdById: user.connexus_user_id,
            modifiedById: user.connexus_user_id,
            isPrimaryTenant: true,
          })),
        }),
      );
    }

    // Add manager to property contacts
    transactions.push(
      this.prismaService.client.propertyContacts.createMany({
        data: [
          {
            userId: managerUserId,
            propertyId,
            creatorId: user.connexus_user_id,
            updaterId: user.connexus_user_id,
          },
        ],
        skipDuplicates: true,
      }),
    );

    if (serviceInput.length > 0) {
      transactions.push(
        this.prismaService.client.propertyServiceMap.createMany({
          data: serviceInput,
        }),
      );
    }

    return transactions;
  }

  async findAll(getPropertyDto: GetPropertyDto, user: RequestUser) {
    const {
      countyIds,
      cityIds,
      stateIds,
      countryIds,
      managerIds = [],
      managerEmailIds = [],
      propertyAddress,
      clientId,
      excludeIds,
      propertiesId,
      serviceIds,
    } = getPropertyDto;

    const combinedManagerIds = [...managerIds, ...managerEmailIds];

    const filters: Prisma.ClientPropertiesWhereInput = {
      deletedAt: null,
    };

    if (cityIds && cityIds.length > 0) {
      filters.cityId = { in: cityIds };
    }

    if (stateIds && stateIds.length > 0) {
      filters.stateId = { in: stateIds };
    }

    if (propertiesId && propertiesId.length > 0) {
      filters.id = { in: propertiesId };
    }

    if (countryIds && countryIds.length > 0) {
      filters.countryId = { in: countryIds };
    }

    if (combinedManagerIds && combinedManagerIds.length > 0) {
      filters.propertyManagerId = { in: combinedManagerIds };
    }

    if (propertyAddress) {
      filters.address = { contains: propertyAddress, mode: 'insensitive' };
    }

    if (countyIds && countyIds.length > 0) {
      filters.countyId = { in: countyIds };
    }

    if (clientId && clientId.length > 0) {
      filters.clientId = { in: clientId };
    }

    if (excludeIds && excludeIds.length > 0) {
      filters.id = { notIn: excludeIds };
    }

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

    if (serviceIds && serviceIds.length > 0) {
      filters.propertyServiceMap = {
        some: {
          serviceId: { in: serviceIds },
        },
      };
    }

    const orderBy = getSortInput({
      sort: getPropertyDto.sort,
      sortDirection: getPropertyDto.sortDirection,
      modelName: Prisma.ModelName.ClientProperties,
      defaultSort: 'createdAt',
    });

    const [data, pagination] = await this.prismaService.client.clientProperties
      .paginate({
        where: getAbilityFilters({
          condition: {
            ...filters,
          },
          user,
          subject: caslSubjects.Property,
        }),

        orderBy,
        select: {
          id: true,
          name: true,
          address: true,
          zip: true,
          tenantId: true,
          clientId: true,
          client: { select: { id: true, name: true } },
          state: {
            select: { id: true, stateName: true, isDeleted: true },
          },
          city: { select: { id: true, cityName: true } },
          country: { select: { id: true, countryName: true } },
          county: { select: { id: true, name: true } },
          status: true,
          unitCount: true,
          buildingCount: true,
          acres: true,
          isRetail: true,
          latitude: true,
          longitude: true,
          propertyManager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          propertyServiceMap: {
            select: {
              service: { select: { id: true, servicesName: true } },
            },
          },
        },
      })
      .withPages(
        getPaginationInput({
          limit: getPropertyDto.limit,
          page: getPropertyDto.page,
        }),
      );

    const filteredData = data.filter((property) => {
      const state = property.state.isDeleted
        ? { id: null, stateName: null }
        : property.state;
      return { ...property, state };
    });

    return { data: filteredData, pagination };
  }

  async findSelectedProperties(
    getSelectedPropertiesDto: GetSelectedPropertiesDto,
    user: RequestUser,
  ) {
    const {
      propertyIds,
      countyIds,
      cityIds,
      stateIds,
      countryIds,
      managerIds = [],
      managerEmailIds = [],
      propertyAddress,
      clientId,
      excludeIds,
      serviceIds,
    } = getSelectedPropertiesDto;

    const combinedManagerIds = [...managerIds, ...managerEmailIds];

    const filters: Prisma.ClientPropertiesWhereInput = {
      deletedAt: null,
      ...(propertyIds && { id: { in: propertyIds } }), // Primary filter for selected properties
    };

    if (cityIds && cityIds.length > 0) {
      filters.cityId = { in: cityIds };
    }

    if (stateIds && stateIds.length > 0) {
      filters.stateId = { in: stateIds };
    }

    if (countryIds && countryIds.length > 0) {
      filters.countryId = { in: countryIds };
    }

    if (combinedManagerIds && combinedManagerIds.length > 0) {
      filters.propertyManagerId = { in: combinedManagerIds };
    }

    if (propertyAddress) {
      filters.address = { contains: propertyAddress, mode: 'insensitive' };
    }

    if (countyIds && countyIds.length > 0) {
      filters.countyId = { in: countyIds };
    }

    if (clientId && clientId.length > 0) {
      filters.clientId = { in: clientId };
    }

    if (excludeIds && excludeIds.length > 0) {
      filters.id = {
        in: propertyIds,
        notIn: excludeIds,
      };
    }

    if (getSelectedPropertiesDto.search) {
      filters.OR = [
        {
          name: {
            contains: getSelectedPropertiesDto.search,
            mode: 'insensitive',
          },
        },
        {
          address: {
            contains: getSelectedPropertiesDto.search,
            mode: 'insensitive',
          },
        },
        {
          zip: {
            contains: getSelectedPropertiesDto.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (getSelectedPropertiesDto.tenantId) {
      filters.client = { tenantId: getSelectedPropertiesDto.tenantId };
    }

    if (getSelectedPropertiesDto.status) {
      filters.status = getSelectedPropertiesDto.status;
    }

    if (getSelectedPropertiesDto.type) {
      filters.type = getSelectedPropertiesDto.type;
    }

    if (getSelectedPropertiesDto.isRetailScope !== undefined) {
      filters.isRetailScope = getSelectedPropertiesDto.isRetailScope;
    }

    if (getSelectedPropertiesDto.isRetail !== undefined) {
      filters.isRetail = getSelectedPropertiesDto.isRetail;
    }

    if (serviceIds && serviceIds.length > 0) {
      filters.propertyServiceMap = {
        some: {
          serviceId: { in: serviceIds },
        },
      };
    }

    const orderBy = getSortInput({
      sort: getSelectedPropertiesDto.sort,
      sortDirection: getSelectedPropertiesDto.sortDirection,
      modelName: Prisma.ModelName.ClientProperties,
      defaultSort: 'createdAt',
    });

    const [data, pagination] = await this.prismaService.client.clientProperties
      .paginate({
        where: getAbilityFilters({
          condition: {
            ...filters,
          },
          user,
          subject: caslSubjects.Property,
        }),

        orderBy,
        select: {
          id: true,
          name: true,
          address: true,
          zip: true,
          tenantId: true,
          clientId: true,
          client: { select: { id: true, name: true } },
          state: {
            select: { id: true, stateName: true, isDeleted: true },
          },
          city: { select: { id: true, cityName: true } },
          country: { select: { id: true, countryName: true } },
          county: { select: { id: true, name: true } },
          status: true,
          unitCount: true,
          buildingCount: true,
          acres: true,
          isRetail: true,
          latitude: true,
          longitude: true,
          propertyManager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          propertyServiceMap: {
            select: {
              service: { select: { id: true, servicesName: true } },
            },
          },
        },
      })
      .withPages(
        getPaginationInput({
          limit: getSelectedPropertiesDto.limit,
          page: getSelectedPropertiesDto.page,
        }),
      );

    const filteredData = data.filter((property) => {
      const state = property.state.isDeleted
        ? { id: null, stateName: null }
        : property.state;
      return { ...property, state };
    });

    return { data: filteredData, pagination };
  }

  async export(getPropertyDto: ExportPropertyDto, user: RequestUser) {
    const where = this.buildWhereClause(getPropertyDto.filters);

    const sort = getSortInput({
      sort: getPropertyDto.filters.sort,
      sortDirection: getPropertyDto.filters.sortDirection,
      modelName: Prisma.ModelName.ClientProperties,
      defaultSort: 'createdAt',
    });

    return this.exportDataService.create({
      fileType: getPropertyDto.fileType,
      type: ExportRequestTypes.PROPERTIES,
      createdById: user.connexus_user_id,
      filters: where,
      sort: sort as object,
    });
  }

  private buildWhereClause(getPropertyDto: GetPropertyDto) {
    const {
      countyIds,
      cityIds,
      stateIds,
      countryIds,
      managerIds = [],
      managerEmailIds = [],
      propertyAddress,
      clientId,
      excludeIds,
      propertiesId,
      serviceIds,
      isRetail,
      isRetailScope,
      search,
      status,
      tenantId,
      type,
    } = getPropertyDto;

    const combinedManagerIds = [...managerIds, ...managerEmailIds];

    const filters: Prisma.ClientPropertiesWhereInput = {
      deletedAt: null,
    };

    if (cityIds?.length > 0) {
      filters.cityId = { in: cityIds };
    }

    if (stateIds?.length > 0) {
      filters.stateId = { in: stateIds };
    }

    if (propertiesId?.length > 0) {
      filters.id = { in: propertiesId };
    }

    if (countryIds?.length > 0) {
      filters.countryId = { in: countryIds };
    }

    if (combinedManagerIds?.length > 0) {
      filters.propertyManagerId = { in: combinedManagerIds };
    }

    if (propertyAddress) {
      filters.address = { contains: propertyAddress, mode: 'insensitive' };
    }

    if (countyIds?.length > 0) {
      filters.countyId = { in: countyIds };
    }

    if (clientId?.length > 0) {
      filters.clientId = { in: clientId };
    }
    if (excludeIds?.length > 0) {
      filters.id = { notIn: excludeIds };
    }

    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { zip: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tenantId) {
      filters.client = { tenantId };
    }

    if (status) {
      filters.status = status;
    }

    if (type) {
      filters.type = type;
    }

    if (isRetailScope !== undefined) {
      filters.isRetailScope = isRetailScope;
    }

    if (isRetail !== undefined) {
      filters.isRetail = isRetail;
    }

    if (serviceIds?.length > 0) {
      filters.propertyServiceMap = {
        some: {
          serviceId: { in: serviceIds },
        },
      };
    }

    return filters;
  }

  async findOne(id: string, user: RequestUser) {
    const property = await this.prismaService.client.clientProperties.findFirst(
      {
        where: getAbilityFilters({
          subject: caslSubjects.Property,
          condition: { id, deletedAt: null },
          user,
        }),
        select: {
          id: true,
          name: true,
          legalName: true,
          website: true,
          tenantId: true,
          address: true,
          zip: true,
          buildingCount: true,
          unitCount: true,
          acres: true,
          isRetail: true,
          isRetailScope: true,
          latitude: true,
          longitude: true,
          floorCount: true,
          note: true,
          status: true,
          type: true,
          buildingClassification: true,
          commercialClassification: true,
          commercialType: true,
          grossSquareFootage: true,
          locationCordinates: true,
          numberOfBeds: true,
          hoaType: true,
          market: true,
          numberOfDoors: true,
          rentableSquareFootage: true,
          studentHousingType: true,
          yearBuilt: true,
          multiFamilyBuildingType: true,
          numberOfUnits: true,
          propertyManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneCode: true,
              phoneNumber: true,
              phoneExtension: true,
            },
          },
          propertyServiceMap: {
            select: {
              id: true,
              service: { select: { id: true, servicesName: true } },
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              tenantId: true,
              logoUrl: true,
              type: true,
            },
          },
          creator: { select: { id: true, fullName: true } },
          state: { select: { id: true, stateName: true, isDeleted: true } },
          city: { select: { id: true, cityName: true } },
          county: { select: { id: true, name: true } },
          country: { select: { id: true, countryName: true } },
        },
      },
    );

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return {
      ...property,
      state: property.state.isDeleted
        ? { id: null, stateName: null }
        : property.state,
    };
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    user: RequestUser,
  ) {
    const property = await this.prismaService.client.clientProperties.findFirst(
      { where: { id, deletedAt: null } },
    );

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Update,
      createPropertySubject(property),
    );

    // CHeck legal name already exists
    if (updatePropertyDto.legalName) {
      const legalNameExists =
        await this.prismaService.client.clientProperties.findFirst({
          where: {
            legalName: {
              equals: updatePropertyDto.legalName,
              mode: 'insensitive',
            },
            id: { not: id },
            deletedAt: null,
          },
        });

      if (legalNameExists) {
        throw new ConflictException('Legal name already exists');
      }
    }

    // --- PropertyServiceMap update logic ---
    const serviceMapOps = [];
    if (updatePropertyDto.services) {
      // Validate all service IDs exist and are not deleted
      const validServices = await this.prismaService.client.services.findMany({
        where: { id: { in: updatePropertyDto.services }, deletedAt: null },
        select: { id: true },
      });
      const validServiceIds = validServices.map((s) => s.id);
      if (validServiceIds.length !== updatePropertyDto.services.length) {
        throw new ConflictException('One or more services are invalid');
      }

      // Get current mappings
      const currentMappings =
        await this.prismaService.client.propertyServiceMap.findMany({
          where: { propertyId: id },
          select: { serviceId: true },
        });
      const currentServiceIds = currentMappings.map((m) => m.serviceId);

      // Determine which to add and which to remove
      const toAdd = updatePropertyDto.services.filter(
        (sid) => !currentServiceIds.includes(sid),
      );
      const toRemove = currentServiceIds.filter(
        (sid) => !updatePropertyDto.services.includes(sid),
      );

      // Prepare ops
      if (toRemove.length > 0) {
        serviceMapOps.push(
          this.prismaService.client.propertyServiceMap.deleteMany({
            where: { propertyId: id, serviceId: { in: toRemove } },
          }),
        );
      }
      if (toAdd.length > 0) {
        serviceMapOps.push(
          this.prismaService.client.propertyServiceMap.createMany({
            data: toAdd.map((serviceId) => ({
              propertyId: id,
              serviceId,
              creatorId: user.connexus_user_id,
              updaterId: user.connexus_user_id,
            })),
            skipDuplicates: true,
          }),
        );
      }
    }
    // --- End PropertyServiceMap update logic ---

    // Property update
    const propertyUpdateOp = this.prismaService.client.clientProperties.update({
      where: { id },
      data: {
        ...(updatePropertyDto.name && { name: updatePropertyDto.name }),
        ...(updatePropertyDto.legalName && {
          legalName: updatePropertyDto.legalName,
        }),
        ...(updatePropertyDto.website && {
          website: updatePropertyDto.website,
        }),
        ...(updatePropertyDto.address && {
          address: updatePropertyDto.address,
        }),
        zip: updatePropertyDto.zip,
        unitCount: updatePropertyDto.unitCount,
        buildingCount: updatePropertyDto.buildingCount,
        type: updatePropertyDto.type,
        floorCount: updatePropertyDto.floorCount,
        acres: updatePropertyDto.acres,
        isRetail: updatePropertyDto.isRetail,
        isRetailScope: updatePropertyDto.isRetailScope,
        latitude: updatePropertyDto.latitude,
        longitude: updatePropertyDto.longitude,
        note: updatePropertyDto.note,
        status: updatePropertyDto.status,
        propertyManagerId: updatePropertyDto.managerId,
        cityId: updatePropertyDto.cityId,
        stateId: updatePropertyDto.stateId,
        updaterId: user.connexus_user_id,
        countyId: updatePropertyDto.countyId,
        countryId: updatePropertyDto.countryId,
        address: updatePropertyDto.address,
        legalName: updatePropertyDto.legalName,
        yearBuilt: updatePropertyDto.yearBuilt,
        hoaType: updatePropertyDto.hoaType,
        numberOfDoors: updatePropertyDto.numberOfDoors,
        buildingClassification: updatePropertyDto.buildingClassification,
        market: updatePropertyDto.market,
        commercialType: updatePropertyDto.commercialType,
        commercialClassification: updatePropertyDto.commercialClassification,
        grossSquareFootage: updatePropertyDto.grossSquareFootage,
        rentableSquareFootage: updatePropertyDto.rentableSquareFootage,
        studentHousingType: updatePropertyDto.studentHousingType,
        numberOfBeds: updatePropertyDto.numberOfBeds,
        multiFamilyBuildingType: updatePropertyDto.multiFamilyBuildingType,
        numberOfUnits: updatePropertyDto.numberOfUnits,
      },
      select: {
        id: true,
        name: true,
        legalName: true,
        website: true,
        address: true,
        zip: true,
        unitCount: true,
        buildingCount: true,
        acres: true,
        isRetail: true,
        isRetailScope: true,
        latitude: true,
        longitude: true,
        note: true,
        status: true,
        type: true,
        floorCount: true,
        propertyManagerId: true,
        yearBuilt: true,
        hoaType: true,
        numberOfDoors: true,
        buildingClassification: true,
        market: true,
        commercialType: true,
        commercialClassification: true,
        grossSquareFootage: true,
        rentableSquareFootage: true,
        studentHousingType: true,
        numberOfBeds: true,
        multiFamilyBuildingType: true,
        numberOfUnits: true,
      },
    });

    // Run all in transaction
    const result = await this.prismaService.client.$transaction([
      propertyUpdateOp,
      ...serviceMapOps,
    ]);

    return result[0];
  }

  async updatePropertyStatus(
    id: string,
    updatePropertyStatusDto: UpdatePropertyStatusDto,
    user: RequestUser,
  ) {
    const property = await this.prismaService.client.clientProperties.findFirst(
      { where: { id, deletedAt: null } },
    );

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Update,
      createPropertySubject(property),
    );

    const updatedProperty =
      await this.prismaService.client.clientProperties.update({
        where: { id },
        data: {
          status: updatePropertyStatusDto.status,
          updater: { connect: { id: user.connexus_user_id } },
        },
        select: { id: true, status: true },
      });

    return updatedProperty;
  }

  async getUserPermissionForProperty(
    input: CheckUserPermissionDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user: RequestUser,
  ) {
    const { tenantId, userId } = input;

    const userTenant = await this.prismaService.client.userTenants.findFirst({
      where: { tenantId, userId },
    });

    if (userTenant.tenantUserFilterType === TenantUserFilterTypes.CLIENT) {
      return { permissionType: TenantUserFilterTypes.CLIENT, properties: [] };
    }

    const propertyContacts =
      await this.prismaService.client.propertyContacts.findMany({
        where: { userId, property: { deletedAt: null } },
        select: {
          propertyId: true,
          userId: true,
          id: true,
          property: { select: { id: true, name: true, tenantId: true } },
        },
      });

    return {
      permissionType: TenantUserFilterTypes.PROPERTY,
      properties: propertyContacts,
    };
  }

  async updatePropertyPermission(
    input: UpdatePropertyPermissionDto,
    user: RequestUser,
  ) {
    const { propertyIds, permissionType, tenantId, userId } = input;

    const userTenant = await this.prismaService.client.userTenants.findFirst({
      where: { tenantId, userId },
    });

    if (!userTenant) {
      throw new NotFoundException('User tenant not found');
    }

    const permissionChanged =
      userTenant.tenantUserFilterType !== permissionType;

    if (permissionChanged && permissionType === TenantUserFilterTypes.CLIENT) {
      await this.prismaService.client.$transaction([
        // Update permission type
        this.prismaService.client.userTenants.update({
          where: { userId_tenantId: { userId, tenantId } },
          data: { tenantUserFilterType: permissionType },
        }),

        // Delete existing property contacts
        this.prismaService.client.propertyContacts.deleteMany({
          where: { userId },
        }),
      ]);
    }

    if (permissionType === TenantUserFilterTypes.PROPERTY) {
      await this.prismaService.client.$transaction(
        async (prisma) => {
          // Delete existing property contacts
          await prisma.propertyContacts.deleteMany({
            where: { userId, propertyId: { notIn: propertyIds } },
          });

          // Add new property contacts
          if (propertyIds.length > 0) {
            await prisma.propertyContacts.createMany({
              data: propertyIds.map((propertyId) => ({
                userId,
                propertyId,
                creatorId: user.connexus_user_id,
                updaterId: user.connexus_user_id,
              })),
              skipDuplicates: true,
            });
          }

          await prisma.userTenants.update({
            where: { userId_tenantId: { userId, tenantId } },
            data: {
              tenantUserFilterType: permissionType,
              modifiedById: user.connexus_user_id,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    }

    return { success: true, message: 'Property permission updated' };
  }

  async getUserProperties(input: GetUserPropertiesDto, user: RequestUser) {
    const { userId, tenantId, search } = input;

    const whereClause: Prisma.ClientPropertiesWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Check user tenant type
    const userTenant = await this.prismaService.client.userTenants.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
        tenantUserFilterType: {
          in: [TenantUserFilterTypes.PROPERTY, TenantUserFilterTypes.CLIENT],
        },
      },
    });

    if (!userTenant) {
      throw new NotFoundException('User tenant not found');
    }

    // For non-client users, add property filter to where clause
    if (userTenant?.tenantUserFilterType !== TenantUserFilterTypes.CLIENT) {
      const userProperties =
        await this.prismaService.client.propertyContacts.findMany({
          where: { userId },
          select: { propertyId: true },
        });
      whereClause.id = { in: userProperties.map((up) => up.propertyId) };
    }

    const orderBy = getSortInput({
      sort: input.sort,
      sortDirection: input.sortDirection,
      modelName: Prisma.ModelName.ClientProperties,
      defaultSort: 'createdAt',
    });

    const [data, pagination] = await this.prismaService.client.clientProperties
      .paginate({
        where: getAbilityFilters({
          condition: whereClause,
          user,
          subject: caslSubjects.Property,
        }),
        orderBy,
        select: {
          id: true,
          name: true,
          address: true,
          zip: true,
          tenantId: true,
          clientId: true,
          city: true,
          state: true,
          country: true,
          county: true,
          client: { select: { id: true, name: true } },
          propertyManager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      })
      .withPages(getPaginationInput({ limit: input.limit, page: input.page }));

    return { data, pagination };
  }
}
