/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

/**
 * This script permanently deletes client-related data from the database
 * It follows a cascading deletion approach to ensure all related data is properly removed
 */
async function deleteClientData(clientIds: string[]): Promise<void> {
  if (!clientIds || clientIds.length === 0) {
    console.error(
      'No client IDs provided. Please provide at least one client ID.',
    );
    process.exit(1);
  }

  console.log(
    `Starting deletion process for client IDs: ${clientIds.join(', ')}`,
  );

  const prisma = new PrismaClient();

  try {
    // Find all the tenant IDs associated with these clients
    const clientsWithTenants = await prisma.client.findMany({
      where: {
        id: { in: clientIds },
      },
      select: {
        id: true,
        name: true,
        tenantId: true,
        clientProperties: {
          select: {
            id: true,
          },
        },
      },
    });

    if (clientsWithTenants.length === 0) {
      console.error('No clients found with the provided IDs.');
      process.exit(1);
    }

    const tenantIds = clientsWithTenants
      .map((client) => client.tenantId)
      .filter(Boolean) as string[];

    const propertyIds = clientsWithTenants.flatMap((client) =>
      client.clientProperties.map((prop) => prop.id),
    );

    console.log(`Found ${clientsWithTenants.length} clients to delete.`);
    console.log(`Found ${tenantIds.length} tenants to delete.`);
    console.log(`Found ${propertyIds.length} properties to delete.`);

    // Step 1: Delete BackgroundJobs first (has FK to tenant)
    if (tenantIds.length > 0) {
      console.log('Deleting background jobs...');
      await prisma.$transaction(
        async (tx) => {
          await tx.backgroundJobs.deleteMany({
            where: { tenantId: { in: tenantIds } },
          });
        },
        {
          timeout: 30000, // 30 seconds
        },
      );
    }

    // Step 2: Handle PropertyContracts and PropertyContractServices
    if (propertyIds.length > 0) {
      console.log('Deleting property contract services...');

      // First get property contract IDs
      const propertyContracts = await prisma.propertyContracts.findMany({
        where: { propertyId: { in: propertyIds } },
        select: { id: true },
      });

      const propertyContractIds = propertyContracts.map((pc) => pc.id);

      // Delete property contract services
      await prisma.$transaction(
        async (tx) => {
          await tx.propertyContractServices.deleteMany({
            where: { propertyContractId: { in: propertyContractIds } },
          });
        },
        {
          timeout: 30000, // 30 seconds
        },
      );

      // Delete property contracts
      await prisma.$transaction(
        async (tx) => {
          await tx.propertyContracts.deleteMany({
            where: { propertyId: { in: propertyIds } },
          });
        },
        {
          timeout: 30000, // 30 seconds
        },
      );
    }

    // Step 3: Handle PropertyServiceMap
    if (propertyIds.length > 0) {
      console.log('Deleting property service mappings...');
      await prisma.$transaction(
        async (tx) => {
          await tx.propertyServiceMap.deleteMany({
            where: { propertyId: { in: propertyIds } },
          });
        },
        {
          timeout: 30000, // 30 seconds
        },
      );
    }

    // Step 4: Handle PropertyContacts
    if (propertyIds.length > 0) {
      console.log('Deleting property contacts...');
      await prisma.$transaction(
        async (tx) => {
          await tx.propertyContacts.deleteMany({
            where: { propertyId: { in: propertyIds } },
          });
        },
        {
          timeout: 30000, // 30 seconds
        },
      );
    }

    // Step 5: Handle ClientProperties
    if (propertyIds.length > 0) {
      console.log('Deleting client properties...');
      await prisma.$transaction(
        async (tx) => {
          await tx.clientProperties.deleteMany({
            where: { id: { in: propertyIds } },
          });
        },
        {
          timeout: 30000, // 30 seconds
        },
      );
    }

    // Step 6: Handle ApprovedClientVendors
    console.log('Deleting approved client vendors...');
    await prisma.$transaction(
      async (tx) => {
        await tx.approvedClientVendors.deleteMany({
          where: { clientId: { in: clientIds } },
        });
      },
      {
        timeout: 30000, // 30 seconds
      },
    );

    // Step 7: Handle UserRoles and RolePermissions
    if (tenantIds.length > 0) {
      // Get roles for these tenants
      const roles = await prisma.roles.findMany({
        where: { tenantsId: { in: tenantIds } },
        select: { id: true },
      });

      const roleIds = roles.map((role) => role.id);

      if (roleIds.length > 0) {
        // Delete user roles
        console.log('Deleting user roles...');
        await prisma.$transaction(
          async (tx) => {
            await tx.userRoles.deleteMany({
              where: { roleId: { in: roleIds } },
            });
          },
          {
            timeout: 30000, // 30 seconds
          },
        );

        // Delete role permissions
        console.log('Deleting role permissions...');
        await prisma.$transaction(
          async (tx) => {
            await tx.rolePermissions.deleteMany({
              where: { rolesId: { in: roleIds } },
            });
          },
          {
            timeout: 30000, // 30 seconds
          },
        );

        // Delete roles
        console.log('Deleting roles...');
        await prisma.$transaction(
          async (tx) => {
            await tx.roles.deleteMany({
              where: { id: { in: roleIds } },
            });
          },
          {
            timeout: 30000, // 30 seconds
          },
        );
      }
    }

    // Step 8: Delete UserTenants
    if (tenantIds.length > 0) {
      console.log('Deleting user tenants...');
      await prisma.$transaction(
        async (tx) => {
          await tx.userTenants.deleteMany({
            where: { tenantId: { in: tenantIds } },
          });
        },
        {
          timeout: 30000, // 30 seconds
        },
      );
    }

    // Step 9: Delete Tenants
    if (tenantIds.length > 0) {
      console.log('Deleting tenant records...');
      await prisma.$transaction(
        async (tx) => {
          await tx.tenants.deleteMany({
            where: { id: { in: tenantIds } },
          });
        },
        {
          timeout: 30000, // 30 seconds
        },
      );
    }

    // Step 10: Delete Clients
    console.log('Deleting client records...');
    await prisma.$transaction(
      async (tx) => {
        await tx.client.deleteMany({
          where: { id: { in: clientIds } },
        });
      },
      {
        timeout: 30000, // 30 seconds
      },
    );

    console.log('Client data deletion completed successfully.');
  } catch (error) {
    console.error('Error during deletion process:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Usage example when run directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Please provide at least one client ID as an argument.');
    console.log(
      'Usage: npx ts-node scripts/delete-client-data/delete-client-data.ts <clientId1> [clientId2] [clientId3] ...',
    );
    process.exit(1);
  }

  deleteClientData(args)
    .then(() => {
      console.log('Script execution completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
}

export { deleteClientData as deleteClient };
