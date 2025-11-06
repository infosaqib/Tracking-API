import { PrismaService as PrismaClientService } from '@app/prisma';
import { TenantUserFilterTypes } from '@prisma/client';

interface GetUserPropertiesParams {
  prismaService: PrismaClientService;
  userId: string;
  tenantId: string;
  childTenants: string[];
  userTenantType: TenantUserFilterTypes;
}

export async function getUserProperties(
  input: GetUserPropertiesParams,
): Promise<{
  propertyIds: string[];
  childTenantProperties: string[];
}> {
  const { prismaService, userId, tenantId, childTenants } = input;

  // Check user tenant type
  const userTenant = await prismaService.client.userTenants.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
  });

  if (userTenant?.tenantUserFilterType === TenantUserFilterTypes.CLIENT) {
    const properties = await prismaService.client.clientProperties.findMany({
      where: {
        tenantId: {
          in: [tenantId, ...childTenants],
        },
      },
    });

    return {
      propertyIds: properties
        .filter((property) => property.tenantId === tenantId)
        .map((property) => property.id),
      childTenantProperties: properties
        .filter((property) => property.tenantId !== tenantId)
        .map((property) => property.id),
    };
  }

  const userProperties = await prismaService.client.propertyContacts.findMany({
    where: {
      userId,
    },
    select: {
      propertyId: true,
    },
  });

  return {
    propertyIds: userProperties.map((userProperty) => userProperty.propertyId),
    childTenantProperties: [],
  };
}
