import { Prisma } from '@prisma/client';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import { PermissionType } from 'src/services/permissions/dto/permissions.entity';
import { Actions } from '../types/actions';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';

export const clientRoleManagementPermissions = (
  input: CreatePermissionInput,
) => {
  const {
    permissionMap,
    userType,
    ability,
    readableTenants: allTenants,
  } = input;
  const { can, cannot } = ability;

  if (userType === 'vendor') {
    return;
  }

  const permissions = permissionMap.get(permissionType.clientRoleManagement);

  if (!permissions) {
    return;
  }

  const condition: Prisma.RolesWhereInput = {
    tenantsId: {
      in: allTenants,
    },
  };

  if (userType === PermissionType.connexus) {
    condition.tenantsId = {
      not: null,
    };
  } else {
    cannot(Actions.Manage, caslSubjects.Roles, {
      tenantsId: {
        notIn: allTenants,
      },
    });
  }

  if (permissions.includes('Create')) {
    can(Actions.Create, caslSubjects.Roles, condition);
  }

  if (permissions.includes('Edit')) {
    can(Actions.Update, caslSubjects.Roles, condition);
  }

  if (permissions.includes('Delete')) {
    can(Actions.Delete, caslSubjects.Roles, condition);
  }

  if (permissions.includes('View')) {
    can(Actions.Read, caslSubjects.Roles, condition);
  }
};
