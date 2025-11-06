import * as dotenv from 'dotenv';
import { db } from './db';
import {
  updateClientAdminPermissions,
  updateVendorAdminTeamPermissions,
} from './roles/update-roles-with-new-permissions';

dotenv.config({
  path: '../../.env',
});

async function main() {
  db.$connect();
  // Create roles
  // await createSuperAdminRole();
  // await createAdminRole();
  // await addSuperAdmin();
  // await countrySeed();
  // await loadInitialData();
  // await updateFullNames();
  // await addSuperAdmin();
  // await cleanUpClients();
  // await addServiceCategories();
  // await mapServicesToCategories();
  // await addServices();
  // await addSubServices();
  // await updateSuperAdminPermissions();
  // await updateConnexusAdminPermissions();
  await updateClientAdminPermissions();
  await updateVendorAdminTeamPermissions();
  // await updateVendorBranchAdminPermissions();
  // await updateVendorFranchiseAdminPermissions();
  // await removeTestTenants();
  // await removeVendors();
  // await syncPropertyManagers();

  // Google Maps location seeding
  // await seedAllLocations(); // Seed all locations (countries, states, cities, counties)
  // await seedCountryLocations(); // Seed only country locations
  // await seedStateLocations(); // Seed only state locations
  // await seedCityLocations(); // Seed only city locations
  // await seedCountyLocations(); // Seed only county locations
  // await checkAllLocationStatus(); // Check status of all location data
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await db.$disconnect();
  });
