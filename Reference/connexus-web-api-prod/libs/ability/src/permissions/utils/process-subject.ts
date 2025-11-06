/* eslint-disable no-param-reassign */
export const processUserObject = (safeUser: any) => {
  if (
    typeof safeUser === 'object' &&
    safeUser !== null &&
    'userTenants' in safeUser
  ) {
    if (Array.isArray(safeUser.userTenants)) {
      //
    } else if (
      typeof safeUser.userTenants === 'object' &&
      safeUser.userTenants !== null &&
      'create' in safeUser.userTenants
    ) {
      // If it's an object with a 'create' property, wrap it in an array
      safeUser.userTenants = [safeUser.userTenants.create];
    } else {
      // If it's neither an array nor an object with 'create', set it to an empty array
      safeUser.userTenants = [];
    }
  } else {
    // If userTenants doesn't exist, initialize it as an empty array
    safeUser.userTenants = [];
  }

  return safeUser;
};
