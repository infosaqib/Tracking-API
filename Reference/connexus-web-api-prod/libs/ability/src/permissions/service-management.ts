import { Prisma } from '@prisma/client';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import { Actions } from '../types/actions';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';

export const serviceManagementPermissions = (input: CreatePermissionInput) => {
  const { permissionMap, ability } = input;

  const permissions = permissionMap.get(permissionType.serviceManagement);

  if (!permissions) {
    return;
  }

  const { can } = ability;

  const condition: Prisma.ServicesWhereInput = {
    deletedAt: null,
  };

  if (permissions.includes('Create')) {
    can(Actions.Create, caslSubjects.Service, condition);
  }

  if (permissions.includes('Edit')) {
    can(Actions.Update, caslSubjects.Service, condition);
  }

  if (permissions.includes('Delete')) {
    can(Actions.Delete, caslSubjects.Service, condition);
  }

  if (permissions.includes('View')) {
    can(Actions.Read, caslSubjects.Service, condition);
  }
};
