import { PrismaService as PrismaClientService } from '@app/prisma';
import { RequestUser } from '@app/shared';
import { ConflictException, NotAcceptableException } from '@nestjs/common';
import { Client, Prisma, TenantUserFilterTypes } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CreatePropertyUserDto } from 'src/types/property-types';
import { CreatePropertyDto } from './dto/create-property.dto';

export async function validatePropertyManager(
  prismaService: PrismaClientService,
  params: {
    managerEmail: string;
    managerUserId: string;
  },
): Promise<void> {
  const { managerEmail, managerUserId } = params;

  if (managerUserId) {
    const managerUser = await prismaService.client.users.findFirst({
      where: { id: managerUserId, deletedAt: null },
    });

    if (!managerUser) {
      throw new NotAcceptableException('Manager user not found');
    }

    return;
  }

  const where: Prisma.UsersWhereInput = {
    deletedAt: null,
    OR: [{ email: managerEmail }],
  };

  const propertyManager = await prismaService.client.users.findFirst({
    where,
  });

  if (propertyManager) {
    const conflictingFields = [];
    if (propertyManager.email === managerEmail) {
      conflictingFields.push('email');
    }

    throw new ConflictException(
      `Property manager with this ${conflictingFields.join(' and ')} already exists`,
    );
  }
}

export async function validateLegalName(
  prismaService: PrismaClientService,
  legalName: string,
): Promise<void> {
  if (!legalName) {
    return;
  }

  const legalNameExists = await prismaService.client.clientProperties.findFirst(
    {
      where: {
        legalName: {
          equals: legalName,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    },
  );

  if (legalNameExists) {
    throw new ConflictException('Legal name already exists');
  }
}

export async function validateUsers(
  prismaService: PrismaClientService,
  users: CreatePropertyUserDto[],
): Promise<void> {
  if (users.length === 0) return;

  const existingUsers = await prismaService.client.users.findMany({
    where: {
      email: {
        in: users.map((u) => u.email),
      },
      deletedAt: null,
    },
  });

  if (existingUsers.length > 0) {
    throw new ConflictException(
      `Users with emails ${users.map((u) => u.email).join(', ')} already exist`,
    );
  }

  // const userWithPhoneNumber = users.filter((u) => u.phoneCode && u.phoneNumber);

  // const phoneNumberFilter: Prisma.UsersWhereInput = {
  //   OR: userWithPhoneNumber.map((u) => ({
  //     phoneCode: u.phoneCode,
  //     phoneNumber: u.phoneNumber,
  //     phoneExtension: u.phoneExtension,
  //   })),
  // };

  // if (userWithPhoneNumber.length > 0) {
  //   const phoneNumberExists = await prismaService.client.users.findMany({
  //     where: phoneNumberFilter,
  //   });

  //   if (phoneNumberExists.length > 0) {
  //     throw new ConflictException(
  //       `Users with phone numbers ${phoneNumberExists
  //         .map((u) => `${u.phoneCode || ''} ${u.phoneNumber || ''}`)
  //         .join(' , ')} already exist`,
  //     );
  //   }
  // }
}

export function createUserCreateInput(
  users: CreatePropertyUserDto[],
  user: RequestUser,
): Prisma.UsersCreateInput[] {
  return (users || []).map((u) => ({
    firstName: u.firstName,
    lastName: u.lastName,
    fullName: `${u.firstName} ${u.lastName}`,
    email: u.email,
    title: u.title,
    phoneCode: u.phoneCode,
    phoneNumber: u.phoneNumber,
    isInternal: false,
    authorized: false,
    creatorId: user.connexus_user_id,
    updaterId: user.connexus_user_id,
    phoneExtension: u.phoneExtension,
    id: randomUUID(),
  }));
}

export function createPropertyData(params: {
  createPropertyDto: CreatePropertyDto;
  propertyId: string;
  managerUserId: string;
  user: RequestUser;
  client: Client;
}): Prisma.ClientPropertiesCreateInput {
  const { createPropertyDto, propertyId, managerUserId, user, client } = params;

  return {
    id: propertyId,
    name: createPropertyDto.name,
    legalName: createPropertyDto.legalName,
    website: createPropertyDto.website,
    address: createPropertyDto.address,
    zip: createPropertyDto.zip,
    unitCount: createPropertyDto.unitCount,
    buildingCount: createPropertyDto.buildingCount,
    type: createPropertyDto.type,
    floorCount: createPropertyDto.floorCount,
    acres: createPropertyDto.acres,
    isRetail: createPropertyDto.isRetail,
    isRetailScope: createPropertyDto.isRetailScope,
    latitude: createPropertyDto.latitude,
    longitude: createPropertyDto.longitude,
    note: createPropertyDto.note,
    status: createPropertyDto.status,
    country: createPropertyDto.countryId
      ? { connect: { id: createPropertyDto.countryId } } // Ensure country is included
      : undefined,
    state: createPropertyDto.stateId
      ? { connect: { id: createPropertyDto.stateId } }
      : undefined,
    city: createPropertyDto.cityId
      ? { connect: { id: createPropertyDto.cityId } }
      : undefined,
    county: createPropertyDto.countyId
      ? { connect: { id: createPropertyDto.countyId } }
      : undefined,
    creator: user.connexus_user_id
      ? { connect: { id: user.connexus_user_id } }
      : undefined,
    updater: user.connexus_user_id
      ? { connect: { id: user.connexus_user_id } }
      : undefined,
    client: { connect: { id: createPropertyDto.clientId } },
    tenant: { connect: { id: client.tenantId } },
    propertyManager: {
      connectOrCreate: {
        where: { id: managerUserId },
        create: {
          id: managerUserId,
          firstName: createPropertyDto.managerFirstName,
          lastName: createPropertyDto.managerLastName,
          email: createPropertyDto.managerEmail,
          phoneCode: createPropertyDto.managerPhoneCode,
          phoneNumber: createPropertyDto.managerPhone,
          phoneExtension: createPropertyDto.managerPhoneExtension,
          fullName: `${createPropertyDto.managerFirstName} ${createPropertyDto.managerLastName}`,
          isInternal: false,
          userTenants: {
            create: {
              tenantId: client.tenantId,
              tenantUserFilterType: TenantUserFilterTypes.PROPERTY,
              createdById: user.connexus_user_id,
              modifiedById: user.connexus_user_id,
              isPrimaryTenant: true,
            },
          },
          creator: { connect: { id: user.connexus_user_id } },
          updater: { connect: { id: user.connexus_user_id } },
        },
      },
    },
    yearBuilt: createPropertyDto.yearBuilt,
    hoaType: createPropertyDto.hoaType,
    numberOfDoors: createPropertyDto.numberOfDoors,
    buildingClassification: createPropertyDto.buildingClassification,
    market: createPropertyDto.market,
    commercialType: createPropertyDto.commercialType,
    commercialClassification: createPropertyDto.commercialClassification,
    grossSquareFootage: createPropertyDto.grossSquareFootage,
    rentableSquareFootage: createPropertyDto.rentableSquareFootage,
    studentHousingType: createPropertyDto.studentHousingType,
    numberOfBeds: createPropertyDto.numberOfBeds,
    multiFamilyBuildingType: createPropertyDto.multiFamilyBuildingType,
    numberOfUnits: createPropertyDto.numberOfUnits,
  };
}

export function createUserTenantData(params: {
  userCreateInput: Prisma.UsersCreateInput[];
  tenantId: string;
  user: RequestUser;
}) {
  const { userCreateInput, tenantId, user } = params;

  return userCreateInput.map((u) => ({
    userId: u.id,
    tenantId,
    tenantUserFilterType: TenantUserFilterTypes.PROPERTY,
    createdById: user.connexus_user_id,
    modifiedById: user.connexus_user_id,
    isPrimaryTenant: true,
  }));
}

export function createPropertyContactData(params: {
  userCreateInput: Prisma.UsersCreateInput[];
  propertyId: string;
  user: RequestUser;
}) {
  const { userCreateInput, propertyId, user } = params;

  return userCreateInput.map((u) => ({
    propertyId,
    userId: u.id,
    creatorId: user.connexus_user_id,
    updaterId: user.connexus_user_id,
  }));
}

export function createPropertyContacts(params: {
  prismaService: PrismaClientService;
  propertyId: string;
  managerUserId: string;
  clientTenantId: string;
  user: RequestUser;
  userCreateInput: Prisma.UsersCreateInput[];
}) {
  const {
    prismaService,
    propertyId,
    managerUserId,
    clientTenantId,
    user,
    userCreateInput,
  } = params;

  return [
    prismaService.client.propertyContacts.create({
      data: {
        propertyId,
        userId: managerUserId,
        creatorId: user.connexus_user_id,
        updaterId: user.connexus_user_id,
      },
    }),

    userCreateInput.length > 0 &&
      prismaService.client.users.createMany({ data: userCreateInput }),
    userCreateInput.length > 0 &&
      prismaService.client.userTenants.createMany({
        data: createUserTenantData({
          userCreateInput,
          tenantId: clientTenantId,
          user,
        }),
      }),
    userCreateInput.length > 0 &&
      prismaService.client.propertyContacts.createMany({
        data: createPropertyContactData({
          userCreateInput,
          propertyId,
          user,
        }),
      }),
  ];
}

export function createServiceInput(
  serviceIds: string[],
  propertyId: string,
  user: RequestUser,
): Prisma.PropertyServiceMapCreateManyInput[] {
  if (!serviceIds || serviceIds.length === 0) {
    return [];
  }

  return serviceIds.map((serviceId) => ({
    serviceId,
    propertyId,
    creatorId: user.connexus_user_id,
    updaterId: user.connexus_user_id,
  }));
}

export async function createPropertyRelations(params: {
  prisma: PrismaClientService;
  propertyId: string;
  managerUserId: string;
  clientTenantId: string;
  user: RequestUser;
  userCreateInput: Prisma.UsersCreateInput[];
}) {
  // Create user tenants
  await params.prisma.client.userTenants.createMany({
    data: createUserTenantData({
      userCreateInput: params.userCreateInput,
      tenantId: params.clientTenantId,
      user: params.user,
    }),
  });
  // Create property contacts
  await params.prisma.client.propertyContacts.createMany({
    data: createPropertyContactData({
      userCreateInput: params.userCreateInput,
      propertyId: params.propertyId,
      user: params.user,
    }),
  });

  // Create property manager as a contact
  await params.prisma.client.propertyContacts.create({
    data: {
      property: { connect: { id: params.propertyId } },
      user: { connect: { id: params.managerUserId } },
      creator: { connect: { id: params.user.connexus_user_id } },
      updater: { connect: { id: params.user.connexus_user_id } },
    },
  });
}
