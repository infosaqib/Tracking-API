import { permissionType } from 'src/services/permissions/dto/permission-types';
import { Actions } from '../types/actions';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';

export const connexusRoleManagementPermissions = (
  input: CreatePermissionInput,
) => {
  const { permissionMap, ability, userType } = input;
  const { can } = ability;

  if (userType !== 'connexus') {
    return;
  }

  const permissions = permissionMap.get(permissionType.connexusRoleManagement);

  if (!permissions) {
    return;
  }

  if (permissions.includes('Create')) {
    can(Actions.Create, caslSubjects.Roles, {
      tenantsId: null,
    });
  }

  if (permissions.includes('Edit')) {
    can(Actions.Update, caslSubjects.Roles, {
      tenantsId: null,
    });
  }

  if (permissions.includes('Delete')) {
    can(Actions.Delete, caslSubjects.Roles, {
      tenantsId: null,
    });
  }

  if (permissions.includes('View')) {
    can(Actions.Read, caslSubjects.Roles, {
      tenantsId: null,
    });
  }
};
