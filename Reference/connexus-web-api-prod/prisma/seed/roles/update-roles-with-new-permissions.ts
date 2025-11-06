/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
import { Prisma, TenantTypes } from '@prisma/client';
import {
  getClientAdminPermissions,
  getConnexusAdminPermissions,
  getConnexusSuperAdminPermissions,
  getVendorAdminPermissions,
  getVendorBranchAdminPermissions,
  getVendorFranchiseAdminPermissions,
} from '../../../src/services/permissions/data/utils/utils';
import { RoleLevel } from '../../../src/services/roles/dto/role-level';
import { db } from '../db';

export const updateSuperAdminPermissions = async () => {
  // Get super admin role
  const superAdminRole = await db.roles.findMany({
    where: {
      roleLevel: RoleLevel.SuperAdmin,
      deletedAt: null,
    },
  });

  if (!superAdminRole.length) {
    throw new Error('Super admin role not found');
  }

  // Update permissions
  const connexusPermissions = getConnexusSuperAdminPermissions();

  const permissionSearchData: Prisma.RolePermissionsCreateManyInput[] =
    superAdminRole.flatMap((role) =>
      connexusPermissions.map((permission) => ({
        rolesId: role.id,
        permissionsId: permission.id,
        creatorId: role.creatorId,
      })),
    );

  // Upsert all permissions in a single query
  await db.rolePermissions.createMany({
    data: permissionSearchData,
    skipDuplicates: true, // Skip duplicates instead of throwing an error
  });
};

export const updateClientAdminPermissions = async () => {
  // Get client admin role
  const clientAdminRole = await db.roles.findMany({
    where: {
      roleLevel: RoleLevel.Admin,
      deletedAt: null,
      tenant: {
        type: TenantTypes.CLIENT,
      },
    },
  });

  if (!clientAdminRole.length) {
    console.log('No client admin role found');
    return;
  }

  // Update permissions
  const clientPermissions = getClientAdminPermissions();

  const permissionSearchData: {
    rolesId: string;
    permissionsId: string;
  }[] = [];

  for (const role of clientAdminRole) {
    for (const permission of clientPermissions) {
      permissionSearchData.push({
        rolesId: role.id,
        permissionsId: permission.id,
      });
    }
  }

  const superAdmin = await db.users.findFirst({
    where: {
      roles: {
        some: {
          roleLevel: RoleLevel.SuperAdmin,
        },
      },
      deletedAt: null,
    },
  });

  // Upsert all permissions in a single query
  await db.rolePermissions.createMany({
    data: permissionSearchData.map((data) => ({
      rolesId: data.rolesId,
      permissionsId: data.permissionsId,
      creatorId: superAdmin?.id,
    })),
    skipDuplicates: true, // Skip duplicates instead of throwing an error
  });

  // Remove old permissions
  await db.rolePermissions.deleteMany({
    where: {
      permissionsId: {
        notIn: permissionSearchData.map((data) => data.permissionsId),
      },
      role: {
        roleLevel: RoleLevel.Admin,
        tenant: {
          type: TenantTypes.CLIENT,
        },
      },
    },
  });
};

export const updateConnexusAdminPermissions = async () => {
  const connexusAdminRole = await db.roles.findMany({
    where: {
      roleLevel: RoleLevel.Admin,
      tenantsId: null,
    },
  });

  if (!connexusAdminRole.length) {
    console.log('No connexus admin role found');
    return;
  }

  const connexusAdminPermissions = getConnexusAdminPermissions();

  const permissionSearchData: {
    rolesId: string;
    permissionsId: string;
  }[] = [];

  for (const role of connexusAdminRole) {
    for (const permission of connexusAdminPermissions) {
      permissionSearchData.push({
        rolesId: role.id,
        permissionsId: permission.id,
      });
    }
  }

  const superAdmin = await db.users.findFirst({
    where: {
      roles: {
        some: { roleLevel: RoleLevel.SuperAdmin },
      },
    },
  });

  // Upsert all permissions in a single query
  await db.rolePermissions.createMany({
    data: permissionSearchData.map((data) => ({
      rolesId: data.rolesId,
      permissionsId: data.permissionsId,
      creatorId: superAdmin?.id,
    })),
    skipDuplicates: true, // Skip duplicates instead of throwing an error
  });
};

export const updateVendorAdminTeamPermissions = async () => {
  const vendorAdminTeamRole = await db.roles.findMany({
    where: {
      roleLevel: RoleLevel.Admin,
      tenant: {
        type: TenantTypes.VENDOR,
      },
    },
  });

  if (!vendorAdminTeamRole.length) {
    console.log('No vendor admin team role found');
    return;
  }

  const vendorAdminTeamPermissions = getVendorAdminPermissions();

  const permissionSearchData: {
    rolesId: string;
    permissionsId: string;
  }[] = [];

  for (const role of vendorAdminTeamRole) {
    for (const permission of vendorAdminTeamPermissions) {
      permissionSearchData.push({
        rolesId: role.id,
        permissionsId: permission.id,
      });
    }
  }

  const superAdmin = await db.users.findFirst({
    where: {
      roles: { some: { roleLevel: RoleLevel.SuperAdmin } },
    },
  });

  await db.rolePermissions.createMany({
    data: permissionSearchData.map((data) => ({
      rolesId: data.rolesId,
      permissionsId: data.permissionsId,
      creatorId: superAdmin?.id,
    })),
    skipDuplicates: true, // Skip duplicates instead of throwing an error
  });

  // Remove old permissions
  await db.rolePermissions.deleteMany({
    where: {
      permissionsId: {
        notIn: permissionSearchData.map((data) => data.permissionsId),
      },
      role: {
        roleLevel: RoleLevel.Admin,
        tenant: { type: TenantTypes.VENDOR },
      },
    },
  });
};

export const updateVendorBranchAdminPermissions = async () => {
  const vendorBranchAdminRole = await db.roles.findMany({
    where: {
      roleLevel: RoleLevel.Admin,
      tenant: {
        type: TenantTypes.VENDOR_BRANCH,
      },
    },
  });

  if (!vendorBranchAdminRole.length) {
    console.log('No vendor branch admin role found');
    return;
  }

  // Remove all permissions for the vendor branch admin role
  // await db.rolePermissions.deleteMany({
  //   where: {
  //     role: {
  //       roleLevel: RoleLevel.Admin,
  //       tenant: { type: TenantTypes.VENDOR_BRANCH },
  //     },
  //   },
  // });

  const vendorBranchAdminPermissions = getVendorBranchAdminPermissions();

  const permissionSearchData: {
    rolesId: string;
    permissionsId: string;
  }[] = [];

  for (const role of vendorBranchAdminRole) {
    for (const permission of vendorBranchAdminPermissions) {
      permissionSearchData.push({
        rolesId: role.id,
        permissionsId: permission.id,
      });
    }
  }

  const superAdmin = await db.users.findFirst({
    where: {
      roles: { some: { roleLevel: RoleLevel.SuperAdmin } },
    },
  });

  await db.rolePermissions.createMany({
    data: permissionSearchData.map((data) => ({
      rolesId: data.rolesId,
      permissionsId: data.permissionsId,
      creatorId: superAdmin?.id,
    })),
    skipDuplicates: true, // Skip duplicates instead of throwing an error
  });

  // Remove old permissions
  await db.rolePermissions.deleteMany({
    where: {
      permissionsId: {
        notIn: permissionSearchData.map((data) => data.permissionsId),
      },
      role: {
        roleLevel: RoleLevel.Admin,
        tenant: {
          type: TenantTypes.VENDOR_BRANCH,
        },
      },
    },
  });
};

export const updateVendorFranchiseAdminPermissions = async () => {
  const vendorFranchiseAdminRole = await db.roles.findMany({
    where: {
      roleLevel: RoleLevel.Admin,
      tenant: {
        type: TenantTypes.VENDOR_FRANCHISE,
      },
    },
  });

  if (!vendorFranchiseAdminRole.length) {
    console.log('No vendor franchise admin role found');
    return;
  }

  const vendorFranchiseAdminPermissions = getVendorFranchiseAdminPermissions();

  const permissionSearchData: {
    rolesId: string;
    permissionsId: string;
  }[] = [];

  for (const role of vendorFranchiseAdminRole) {
    for (const permission of vendorFranchiseAdminPermissions) {
      permissionSearchData.push({
        rolesId: role.id,
        permissionsId: permission.id,
      });
    }
  }

  const superAdmin = await db.users.findFirst({
    where: {
      roles: { some: { roleLevel: RoleLevel.SuperAdmin } },
    },
  });

  await db.rolePermissions.createMany({
    data: permissionSearchData.map((data) => ({
      rolesId: data.rolesId,
      permissionsId: data.permissionsId,
      creatorId: superAdmin?.id,
    })),
    skipDuplicates: true, // Skip duplicates instead of throwing an error
  });

  // Remove old permissions
  await db.rolePermissions.deleteMany({
    where: {
      permissionsId: {
        notIn: permissionSearchData.map((data) => data.permissionsId),
      },
      role: {
        roleLevel: RoleLevel.Admin,
        tenant: {
          type: TenantTypes.VENDOR_FRANCHISE,
        },
      },
    },
  });
};
