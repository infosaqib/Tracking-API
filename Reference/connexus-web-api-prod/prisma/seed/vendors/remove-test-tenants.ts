import { db } from '../db';

const ids = [
  'test-tenant-1',
  'test-tenant-2',
  'test-tenant-3',
  'test-tenant-4',
];

export async function removeTestTenants() {
  await db.$transaction(async (transaction) => {
    // Remove UserRoles
    await transaction.userRoles.deleteMany({
      where: {
        role: {
          tenantsId: {
            in: ids,
          },
        },
      },
    });

    // Remove role permissions
    await transaction.rolePermissions.deleteMany({
      where: {
        role: {
          tenantsId: {
            in: ids,
          },
        },
      },
    });

    // Remove Roles
    await transaction.roles.deleteMany({
      where: {
        tenantsId: {
          in: ids,
        },
      },
    });

    // Remove Tenants
    await transaction.tenants.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  });
}
