/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface DeleteVendorDataOptions {
  vendorId: string;
  dryRun?: boolean;
}

/**
 * Deletes a vendor and all its related data
 * @param options - Options for deleting vendor data
 * @returns Object containing deletion results
 */
export const deleteVendorData = async (
  options: DeleteVendorDataOptions,
): Promise<{
  vendor: any;
  vendorServices: number;
  vendorNotes: number;
  vendorServicableAreas: number;
  contracts: number;
  approvedClientVendors: number;
  childCompanies: number;
}> => {
  const { vendorId, dryRun = false } = options;

  try {
    // 1. Get the vendor first to verify it exists
    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      include: {
        vendorServices: true,
        vendorNotes: true,
        vendorServicableAreas: true,
        Contracts: true,
        ApprovedClientVendors: true,
        childCompanies: true,
      },
    });

    if (!vendor) {
      throw new Error(`Vendor with ID ${vendorId} not found`);
    }

    if (dryRun) {
      return {
        vendor,
        vendorServices: vendor.vendorServices.length,
        vendorNotes: vendor.vendorNotes.length,
        vendorServicableAreas: vendor.vendorServicableAreas.length,
        contracts: vendor.Contracts.length,
        approvedClientVendors: vendor.ApprovedClientVendors.length,
        childCompanies: vendor.childCompanies.length,
      };
    }

    // Start a transaction with increased timeout
    const result = await prisma.$transaction(
      async (tx) => {
        // 2. Delete VendorServicableAreas first
        await tx.vendorServicableAreas.deleteMany({
          where: { vendorId },
        });

        // 3. Delete VendorNotes
        await tx.vendorNotes.deleteMany({
          where: { vendorId },
        });

        // 4. Delete VendorServices
        await tx.vendorServices.deleteMany({
          where: { vendorId },
        });

        // 5. Delete ApprovedClientVendors
        await tx.approvedClientVendors.deleteMany({
          where: { vendorId },
        });

        // 6. Delete Contracts and related data
        const contracts = await tx.contracts.findMany({
          where: { vendorId },
          include: {
            propertyContracts: {
              include: {
                PropertyContractServices: true,
              },
            },
          },
        });

        // Delete PropertyContractServices first
        for (const contract of contracts) {
          for (const propertyContract of contract.propertyContracts) {
            await tx.propertyContractServices.deleteMany({
              where: { propertyContractId: propertyContract.id },
            });
          }
        }

        // Delete PropertyContracts
        for (const contract of contracts) {
          await tx.propertyContracts.deleteMany({
            where: { contractId: contract.id },
          });
        }

        // Finally delete Contracts
        await tx.contracts.deleteMany({
          where: { vendorId },
        });

        // 7. Update child companies to remove parent reference
        await tx.vendors.updateMany({
          where: { parentCompanyId: vendorId },
          data: { parentCompanyId: null },
        });

        // 8. Finally delete the vendor
        await tx.vendors.delete({
          where: { id: vendorId },
        });

        return {
          vendor,
          vendorServices: vendor.vendorServices.length,
          vendorNotes: vendor.vendorNotes.length,
          vendorServicableAreas: vendor.vendorServicableAreas.length,
          contracts: vendor.Contracts.length,
          approvedClientVendors: vendor.ApprovedClientVendors.length,
          childCompanies: vendor.childCompanies.length,
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
    console.error('Error in deleteVendorData:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Example usage
if (require.main === module) {
  const vendorId = process.argv[2];
  const dryRun = process.argv[3] === '--dry-run';

  if (!vendorId) {
    console.error('Please provide a vendor ID as an argument');
    process.exit(1);
  }

  deleteVendorData({ vendorId, dryRun })
    .then((result) => {
      if (dryRun) {
        console.log('Dry run results:');
        console.log('Vendor:', result.vendor);
        console.log('Number of vendor services:', result.vendorServices);
        console.log('Number of vendor notes:', result.vendorNotes);
        console.log(
          'Number of vendor servicable areas:',
          result.vendorServicableAreas,
        );
        console.log('Number of contracts:', result.contracts);
        console.log(
          'Number of approved client vendors:',
          result.approvedClientVendors,
        );
        console.log('Number of child companies:', result.childCompanies);
      } else {
        console.log('Successfully deleted vendor and related data:');
        console.log('Deleted vendor:', result.vendor);
        console.log('Deleted vendor services:', result.vendorServices);
        console.log('Deleted vendor notes:', result.vendorNotes);
        console.log(
          'Deleted vendor servicable areas:',
          result.vendorServicableAreas,
        );
        console.log('Deleted contracts:', result.contracts);
        console.log(
          'Deleted approved client vendors:',
          result.approvedClientVendors,
        );
        console.log('Updated child companies:', result.childCompanies);
      }
    })
    .catch((error) => {
      console.error('Error deleting vendor data:', error);
      process.exit(1);
    });
}
