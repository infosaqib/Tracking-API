/* eslint-disable no-console */
import { Prisma } from '@prisma/client';
import { getConnexusAdminPermissions } from '../../../src/services/permissions/data/utils/utils';
import { RoleLevel } from '../../../src/services/roles/dto/role-level';
import { db } from '../db';

export const createAdminRole = async () => {
  try {
    // Check if admin role already exists
    const existingAdmin = await db.roles.findFirst({
      where: {
        roleLevel: RoleLevel.Admin,
        name: 'Admin',
      },
    });

    if (existingAdmin) {
      console.log('Admin role already exists');
      return;
    }

    // Create admin role
    const adminRole = await db.roles.create({
      data: {
        name: 'Admin',
        roleLevel: RoleLevel.Admin,
      },
    });

    // Get all admin permissions
    const adminPermissions = getConnexusAdminPermissions();

    // Create role permissions
    const rolePermissionsData: Prisma.RolePermissionsCreateManyInput[] =
      adminPermissions.map((permission) => ({
        rolesId: adminRole.id,
        permissionsId: permission.id,
      }));

    // Create role permissions
    await db.rolePermissions.createMany({
      data: rolePermissionsData,
      skipDuplicates: true,
    });

    console.log('Successfully created admin role with permissions');
  } catch (error) {
    console.error('Error creating admin role:', error);
    throw error;
  }
};
