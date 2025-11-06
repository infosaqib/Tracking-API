import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface DeleteServiceDataOptions {
  serviceId: string;
  dryRun?: boolean;
}

/**
 * Deletes a service and all its related data
 * @param options - Options for deleting service data
 * @returns Object containing deletion results
 */
export const deleteServiceData = async (
  options: DeleteServiceDataOptions,
): Promise<{
  service: any;
  subServices: number;
  propertyServiceMaps: number;
  vendorServices: number;
  propertyContractServices: number;
}> => {
  const { serviceId, dryRun = false } = options;

  try {
    // 1. Get the service first to verify it exists
    const service = await prisma.services.findUnique({
      where: { id: serviceId },
      include: {
        subServices: true,
        propertyServiceMap: true,
        vendorServices: true,
        contractServices: true,
      },
    });

    if (!service) {
      throw new Error(`Service with ID ${serviceId} not found`);
    }

    if (dryRun) {
      return {
        service,
        subServices: service.subServices.length,
        propertyServiceMaps: service.propertyServiceMap.length,
        vendorServices: service.vendorServices.length,
        propertyContractServices: service.contractServices.length,
      };
    }

    // Start a transaction with increased timeout
    const result = await prisma.$transaction(
      async (tx) => {
        // 2. Delete PropertyContractServices first (has foreign key to services)
        await tx.propertyContractServices.deleteMany({
          where: { serviceId },
        });

        // 3. Delete VendorServices
        await tx.vendorServices.deleteMany({
          where: { serviceId },
        });

        // 4. Delete PropertyServiceMap
        await tx.propertyServiceMap.deleteMany({
          where: { serviceId },
        });

        // 5. Delete SubServices
        await tx.subServices.deleteMany({
          where: { servicesId: serviceId },
        });

        // 6. Finally delete the service
        await tx.services.delete({
          where: { id: serviceId },
        });

        return {
          service,
          subServices: service.subServices.length,
          propertyServiceMaps: service.propertyServiceMap.length,
          vendorServices: service.vendorServices.length,
          propertyContractServices: service.contractServices.length,
        };
      },
      {
        timeout: 30000, // Increase timeout to 30 seconds
        maxWait: 30000, // Maximum time to wait for the transaction
        isolationLevel: 'Serializable', // Highest isolation level for safety
      },
    );

    return result;
  } catch (error) {
    console.error('Error in deleteServiceData:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Example usage
if (require.main === module) {
  const serviceId = process.argv[2];
  const dryRun = process.argv[3] === '--dry-run';

  if (!serviceId) {
    console.error('Please provide a service ID as an argument');
    process.exit(1);
  }

  deleteServiceData({ serviceId, dryRun })
    .then((result) => {
      if (dryRun) {
        console.log('Dry run results:');
        console.log('Service:', result.service);
        console.log('Number of sub-services:', result.subServices);
        console.log(
          'Number of property service maps:',
          result.propertyServiceMaps,
        );
        console.log('Number of vendor services:', result.vendorServices);
        console.log(
          'Number of property contract services:',
          result.propertyContractServices,
        );
      } else {
        console.log('Successfully deleted service and related data:');
        console.log('Deleted service:', result.service);
        console.log('Deleted sub-services:', result.subServices);
        console.log(
          'Deleted property service maps:',
          result.propertyServiceMaps,
        );
        console.log('Deleted vendor services:', result.vendorServices);
        console.log(
          'Deleted property contract services:',
          result.propertyContractServices,
        );
      }
    })
    .catch((error) => {
      console.error('Error deleting service data:', error);
      process.exit(1);
    });
}
