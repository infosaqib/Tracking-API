import * as dotenv from 'dotenv';
import { addUserAttributesToCognito } from './cognito/add-user-attributes';

dotenv.config();
export const main = async () => {
  // await removeAllUsersFromCognito();
  await addUserAttributesToCognito();
};

main();

// Export the client data deletion utility
export * from './delete-client-data/delete-client-data';
