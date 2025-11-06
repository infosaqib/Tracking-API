/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

/**
 * This script permanently deletes property-related data from the database
 * It follows a cascading deletion approach to ensure all related data is properly removed
 */
async function deletePropertyData(propertyIds: string[]): Promise<void> {
  if (!propertyIds || propertyIds.length === 0) {
    console.error(
      'No property IDs provided. Please provide at least one property ID.',
    );
    process.exit(1);
  }

  console.log(
    `Starting deletion process for property IDs: ${propertyIds.join(', ')}`,
  );

  const prisma = new PrismaClient();

  try {
    // Step 1: Delete PropertyContractServices (via PropertyContracts)
    const propertyContracts = await prisma.propertyContracts.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { id: true },
    });
    const propertyContractIds = propertyContracts.map((pc) => pc.id);
    if (propertyContractIds.length > 0) {
      console.log('Deleting property contract services...');
      await prisma.$transaction(
        async (tx) => {
          await tx.propertyContractServices.deleteMany({
            where: { propertyContractId: { in: propertyContractIds } },
          });
        },
        { timeout: 30000 },
      );
    }

    // Step 2: Delete PropertyContracts
    if (propertyIds.length > 0) {
      console.log('Deleting property contracts...');
      await prisma.$transaction(
        async (tx) => {
          await tx.propertyContracts.deleteMany({
            where: { propertyId: { in: propertyIds } },
          });
        },
        { timeout: 30000 },
      );
    }

    // Step 3: Delete PropertyServiceMap
    if (propertyIds.length > 0) {
      console.log('Deleting property service mappings...');
      await prisma.$transaction(
        async (tx) => {
          await tx.propertyServiceMap.deleteMany({
            where: { propertyId: { in: propertyIds } },
          });
        },
        { timeout: 30000 },
      );
    }

    // Step 4: Delete PropertyContacts
    if (propertyIds.length > 0) {
      console.log('Deleting property contacts...');
      await prisma.$transaction(
        async (tx) => {
          await tx.propertyContacts.deleteMany({
            where: { propertyId: { in: propertyIds } },
          });
        },
        { timeout: 30000 },
      );
    }

    // Step 5: Delete ClientProperties
    if (propertyIds.length > 0) {
      console.log('Deleting client properties...');
      await prisma.$transaction(
        async (tx) => {
          await tx.clientProperties.deleteMany({
            where: { id: { in: propertyIds } },
          });
        },
        { timeout: 30000 },
      );
    }

    // Step 6: Delete the Properties themselves
    console.log('Deleting property records...');
    await prisma.$transaction(
      async (tx) => {
        await tx.clientProperties.deleteMany({
          where: { id: { in: propertyIds } },
        });
      },
      { timeout: 30000 },
    );

    console.log('Property data deletion completed successfully.');
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
    console.error('Please provide at least one property ID as an argument.');
    console.log(
      'Usage: npx ts-node scripts/delete-property-data/delete-property-data.ts <propertyId1> [propertyId2] [propertyId3] ...',
    );
    process.exit(1);
  }

  deletePropertyData(args)
    .then(() => {
      console.log('Script execution completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
}

export { deletePropertyData as deleteProperty };
