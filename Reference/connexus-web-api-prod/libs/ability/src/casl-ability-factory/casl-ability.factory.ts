import { PrismaService as PrismaClientService } from '@app/prisma';
import { AbilityBuilder } from '@casl/ability';
import { createPrismaAbility } from '@casl/prisma';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Prisma, TenantTypes } from '@prisma/client';
import { uniqueArray } from 'apps/connexus-be/src/services/permissions/data/utils/utils';
import { PermissionType } from 'apps/connexus-be/src/services/permissions/dto/permissions.entity';
import { convertPermissionToMap } from '../helpers/casl-helpers';
import { getUserProperties } from '../helpers/get-user-properties';
import { permissionHandlers } from '../permissions';
import { AppAbility } from '../types/casl-subjects';
import { UserProperties } from '../types/create-permission-input';

const logger = new Logger('CaslAbilityFactory');

@Injectable()
export class CaslAbilityFactory {
  constructor(private readonly prismaService: PrismaClientService) {}

  async createForUser(input: {
    userId: string;
    userType: PermissionType;
    tenantId: string | null;
  }) {
    const { userId, userType } = input;

    const user = await this.prismaService.client.users.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        userTenants: {
          select: {
            tenantId: true,
            tenantUserFilterType: true,
          },
        },
        propertyContacts: {
          select: {
            propertyId: true,
          },
        },
        userRoles: {
          select: {
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
                rolePermissions: {
                  select: {
                    permissionsId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let tenantId = null;

    if (user) {
      tenantId = user.userTenants[0]?.tenantId;
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const abilityData = new AbilityBuilder<AppAbility>(createPrismaAbility);

    let childTenantIds: string[] = [];
    let readOnlyTenants: string[] = [];
    let readableTenants: string[] = [];

    if (tenantId && tenantId !== 'connexus') {
      const childTenants = await this.prismaService.client.tenants.findMany({
        where: {
          parentTenantId: tenantId,
        },
      });

      childTenantIds = childTenants.map((tenant) => tenant.id);
    }

    // Get user roles
    const { userRoles } = user;

    const existingPermissionMap = convertPermissionToMap(userRoles);

    let properties: UserProperties = {
      propertyIds: [],
      childTenantProperties: [],
    };

    if (userType === PermissionType.client && tenantId) {
      properties = await getUserProperties({
        prismaService: this.prismaService,
        userId: user.id,
        tenantId,
        childTenants: childTenantIds,
        userTenantType: user.userTenants[0]?.tenantUserFilterType,
      });

      logger.debug(`properties: ${JSON.stringify(properties, null, 2)}`);
    }

    let writableTenants: string[] = [];

    const branchOrFranchiseWhereInput: Prisma.VendorsWhereInput = {
      tenant: {},
    };

    logger.debug(`userType: ${userType}`);
    logger.debug(`tenantId: ${tenantId}`);

    if (
      [
        PermissionType.vendor,
        PermissionType.vendorBranch,
        PermissionType.vendorFranchise,
      ].includes(userType)
    ) {
      // Handle branches
      if (userType === PermissionType.vendor) {
        logger.debug('Handling vendor permission');
        branchOrFranchiseWhereInput.tenant = {
          parentTenantId: {
            in: [tenantId, ...childTenantIds],
          },
          type: TenantTypes.VENDOR_BRANCH,
        };
      } else if (userType === PermissionType.vendorFranchise) {
        logger.debug('Handling vendor franchise permission');
        branchOrFranchiseWhereInput.tenant = {
          userTenants: {
            some: {
              userId: user.id,
            },
          },
          type: TenantTypes.VENDOR_FRANCHISE,
        };
      } else if (userType === PermissionType.vendorBranch) {
        logger.debug('Handling vendor branch permission');
        branchOrFranchiseWhereInput.tenant = {
          userTenants: {
            some: {
              userId: user.id,
            },
          },
          type: TenantTypes.VENDOR_BRANCH,
        };
      }

      const branches = await this.prismaService.client.vendors.findMany({
        where: branchOrFranchiseWhereInput,
        select: {
          tenantId: true,
          tenant: {
            select: {
              parentTenantId: true,
            },
          },
        },
      });

      if (userType === PermissionType.vendor) {
        writableTenants = branches
          .filter((branch) => branch.tenant.parentTenantId === tenantId)
          .map((branch) => branch.tenantId);
        const childBranches = branches
          .filter((branch) => branch.tenant.parentTenantId !== tenantId)
          .map((branch) => branch.tenantId);

        writableTenants = uniqueArray([...writableTenants, tenantId]);
        readOnlyTenants = [...readOnlyTenants, ...childBranches];
      } else {
        writableTenants = branches.map((branch) => branch.tenantId);
        writableTenants = uniqueArray([...writableTenants, tenantId]);
      }
      logger.log(`writableTenants: ${JSON.stringify(writableTenants)}`);
    }
    readOnlyTenants = uniqueArray([
      ...readOnlyTenants,
      tenantId,
      ...childTenantIds,
    ]);

    readableTenants = uniqueArray([
      ...readableTenants,
      ...readOnlyTenants,
      ...writableTenants,
    ]);

    // eslint-disable-next-line no-restricted-syntax
    for (const element of permissionHandlers) {
      element({
        permissionMap: existingPermissionMap,
        userType,
        ability: abilityData,
        tenantId,
        childTenants: childTenantIds,
        readableTenants,
        writableTenants,
        properties,
        userTenantType: user.userTenants[0]?.tenantUserFilterType,
      });
    }

    const ability = abilityData.build();

    logger.debug(JSON.stringify(ability.rules));

    return {
      ability,
      user,
      writableTenants,
      readOnlyTenants: readOnlyTenants?.filter(Boolean),
    };
  }
}
