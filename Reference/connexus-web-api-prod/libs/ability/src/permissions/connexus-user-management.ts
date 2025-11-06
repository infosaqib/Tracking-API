import { subject } from '@casl/ability';
import { Prisma, Users } from '@prisma/client';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import { Actions } from '../types/actions';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';
import { processUserObject } from './utils/process-subject';

export const connexusUserManagementPermissions = (
  input: CreatePermissionInput,
) => {
  const { permissionMap, ability, userType } = input;
  const { can } = ability;

  if (userType !== 'connexus') {
    return;
  }

  const connexusUserPermission = permissionMap.get(
    permissionType.connexusUserManagement,
  );

  if (!connexusUserPermission) {
    return;
  }

  const condition: Prisma.UsersWhereInput | null = {
    userTenants: {
      none: {},
    },
  };

  if (connexusUserPermission.includes('Create')) {
    can(Actions.Create, 'Users', condition);
  }

  if (connexusUserPermission.includes('Edit')) {
    can(Actions.Update, 'Users', condition);
  }

  if (connexusUserPermission.includes('Delete')) {
    can(Actions.Delete, 'Users', condition);
  }

  if (connexusUserPermission.includes('View')) {
    can(Actions.Read, 'Users', condition);
  }
};

export const createUserSubject = (user: any, process = false) => {
  let safeUser = { ...user };

  if (process) {
    safeUser = processUserObject(safeUser);
  }

  return subject(caslSubjects.Users, safeUser as Users);
};
