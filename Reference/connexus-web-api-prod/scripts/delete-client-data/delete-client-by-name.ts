/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { deleteClient } from './delete-client-data';

/**
 * Result type for client deletion operations
 */
export interface ClientDeletionResult {
  name: string;
  status: string;
  id?: string;
}

/**
 * Finds clients by name and deletes them if exactly one client exists with that name
 * @returns Array of results with status for each client name
 */
async function deleteClientsByNames(
  clientNames: string[],
): Promise<ClientDeletionResult[]> {
  if (!clientNames || clientNames.length === 0) {
    console.error(
      'No client names provided. Please provide at least one client name.',
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const results: ClientDeletionResult[] = [];

  try {
    // Process each client name
    for (const clientName of clientNames) {
      console.log(`Searching for client with name: "${clientName}"`);

      // Find clients with this name
      const clients = await prisma.client.findMany({
        where: {
          name: clientName,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (clients.length === 0) {
        console.log(`No client found with name: "${clientName}"`);
        results.push({
          name: clientName,
          status: 'SKIPPED - No client found with this name',
        });
        continue;
      }

      if (clients.length > 1) {
        console.log(
          `Multiple clients (${clients.length}) found with name: "${clientName}". Skipping deletion.`,
        );
        results.push({
          name: clientName,
          status: `SKIPPED - Multiple clients found (${clients.length})`,
        });
        continue;
      }

      // Exactly one client found with this name
      const client = clients[0];
      console.log(
        `Found exactly one client with name: "${clientName}" (ID: ${client.id}). Proceeding with deletion...`,
      );

      try {
        await deleteClient([client.id]);
        console.log(
          `Successfully deleted client: "${clientName}" (ID: ${client.id})`,
        );
        results.push({
          name: clientName,
          status: 'DELETED',
          id: client.id,
        });
      } catch (error) {
        console.error(
          `Error deleting client "${clientName}" (ID: ${client.id}):`,
          error,
        );
        results.push({
          name: clientName,
          status: 'ERROR - Deletion failed',
          id: client.id,
        });
      }
    }

    // Print summary
    console.log('\n======= DELETION SUMMARY =======');
    results.forEach((result) => {
      console.log(
        `${result.name}: ${result.status}${result.id ? ` (ID: ${result.id})` : ''}`,
      );
    });

    // Return results for further processing
    return results;
  } catch (error) {
    console.error('Error during client deletion process:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Usage example when run directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Please provide at least one client name as an argument.');
    console.log(
      'Usage: npx ts-node scripts/delete-client-data/delete-client-by-name.ts "Client Name 1" "Client Name 2" ...',
    );
    process.exit(1);
  }

  // Parse client names directly from args
  const clientNames = args;

  // Alternatively, for the specific list from the question:
  /*
  const clientNames = [
    'BGO Verification Test',
    'Verification Test Client',
    'Smoke Drag and Drop',
    'Smoke Drag and Drop Feature',
    'Regression Automation',
    'Auto Verification',
    'regression client',
    'Client Verification Regres',
    'Client HOA Unique',
    'Client Legal Bulk',
    'Acento'
  ];
  */

  deleteClientsByNames(clientNames)
    .then(() => {
      console.log('Script execution completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
}

export { deleteClientsByNames };
