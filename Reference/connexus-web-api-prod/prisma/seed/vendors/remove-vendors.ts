import { TenantTypes } from '@prisma/client';
import { db } from '../db';

export async function removeVendors() {
  const vendorsTenants = await db.tenants.findMany({
    select: {
      id: true,
      vendorId: true,
    },
    where: {
      type: TenantTypes.VENDOR,
    },
  });

  const ids = vendorsTenants.map((tenant) => tenant.id);

  await db.$transaction(async (transaction) => {
    // Remove UserTenants
    await transaction.userTenants.deleteMany({
      where: {
        tenantId: {
          in: ids,
        },
      },
    });

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

    // Remove Vendors
    await transaction.vendors.deleteMany({
      where: {},
    });
  });
}
