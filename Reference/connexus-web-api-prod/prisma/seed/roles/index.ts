import { Prisma } from '@prisma/client';
import { ConnexusTeamPermissions } from '../../../src/services/permissions/data/connexus-team-permissions';
import { RoleLevel } from '../../../src/services/roles/dto/role-level';
import { db } from '../db';

export const createRole = async (name: string, roleLevel = 2) => {
  const superAdminRole: Prisma.RolesCreateInput = {
    name,
    readOnly: true,
  };

  await db.$transaction(async (tx) => {
    const superAdmin = await tx.roles.findFirst({
      where: {
        name: superAdminRole.name,
        tenantsId: null,
        deletedAt: null,
        roleLevel: RoleLevel.SuperAdmin,
      },
      include: {
        rolePermissions: true,
      },
    });

    if (!superAdmin) {
      await tx.roles.create({
        data: {
          ...superAdminRole,
          roleLevel,
          rolePermissions: {
            create: ConnexusTeamPermissions.map((permission) => ({
              permissionsId: permission.id,
            })),
          },
        },
        include: {
          rolePermissions: true,
        },
      });

      return;
    }

    // Update permissions
    const existingPermissions = superAdmin.rolePermissions.map(
      (permission) => permission.permissionsId,
    );

    // Permissions to delete
    const toDelete = existingPermissions.filter(
      (permission) =>
        !ConnexusTeamPermissions.map((p) => p.id).includes(permission),
    );

    // Permissions to create
    const toCreate = ConnexusTeamPermissions.filter(
      (permission) => !existingPermissions.includes(permission.id),
    );

    if (toDelete.length) {
      await tx.rolePermissions.deleteMany({
        where: {
          rolesId: superAdmin.id,
          permissionsId: {
            in: toDelete,
          },
        },
      });
    }

    if (toCreate.length) {
      await tx.rolePermissions.createMany({
        data: toCreate.map((permission) => ({
          rolesId: superAdmin.id,
          permissionsId: permission.id,
        })),
      });
    }
  });
};

export const roleSeed = async () => {
  await createRole('Super Admin', 0);
  await createRole('Admin', 1);
};
