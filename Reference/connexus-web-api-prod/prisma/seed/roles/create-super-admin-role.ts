/* eslint-disable no-console */
import { Prisma } from '@prisma/client';
import { getConnexusSuperAdminPermissions } from '../../../src/services/permissions/data/utils/utils';
import { RoleLevel } from '../../../src/services/roles/dto/role-level';
import { db } from '../db';

export const createSuperAdminRole = async () => {
  try {
    // Check if super admin role already exists
    const existingSuperAdmin = await db.roles.findFirst({
      where: {
        roleLevel: RoleLevel.SuperAdmin,
        name: 'Super Admin',
      },
    });

    if (existingSuperAdmin) {
      console.log('Super admin role already exists');
      return;
    }

    // Create super admin role
    const superAdminRole = await db.roles.create({
      data: {
        name: 'Super Admin',
        roleLevel: RoleLevel.SuperAdmin,
      },
    });

    // Get all super admin permissions
    const superAdminPermissions = getConnexusSuperAdminPermissions();

    // Create role permissions
    const rolePermissionsData: Prisma.RolePermissionsCreateManyInput[] =
      superAdminPermissions.map((permission) => ({
        rolesId: superAdminRole.id,
        permissionsId: permission.id,
      }));

    // Create role permissions
    await db.rolePermissions.createMany({
      data: rolePermissionsData,
      skipDuplicates: true,
    });

    console.log('Successfully created super admin role with permissions');
  } catch (error) {
    console.error('Error creating super admin role:', error);
    throw error;
  }
};
