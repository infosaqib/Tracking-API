import { Prisma, TenantTypes } from '@prisma/client';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import { PermissionType } from 'src/services/permissions/dto/permissions.entity';
import { Actions } from '../types/actions';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';

export const clientUserManagementPermissions = (
  input: CreatePermissionInput,
) => {
  const {
    permissionMap,
    ability,
    userType,
    readableTenants: allTenants,
  } = input;
  const { can, cannot } = ability;

  if (userType === PermissionType.vendor) {
    return;
  }

  let condition: Prisma.UsersWhereInput | null = {
    userTenants: {
      some: {
        tenantId: {
          in: allTenants,
        },
        tenant: {
          type: {
            in: [TenantTypes.CLIENT],
          },
        },
      },
    },
  };

  if (userType === PermissionType.connexus) {
    condition = null;
  } else {
    cannot(Actions.Manage, caslSubjects.Users, {
      userTenants: {
        some: {
          tenantId: {
            notIn: allTenants,
          },
        },
      },
    });
  }

  const permissions = permissionMap.get(permissionType.clientUserManagement);

  if (!permissions) {
    return;
  }

  if (permissions.includes('Create')) {
    can(Actions.Create, caslSubjects.Users, condition).because(
      'You cannot create this user',
    );
  }

  if (permissions.includes('Edit')) {
    can(Actions.Update, caslSubjects.Users, condition).because(
      'You cannot edit this user',
    );
  }

  if (permissions.includes('Delete')) {
    can(Actions.Delete, caslSubjects.Users, condition);
  }

  if (permissions.includes('View')) {
    can(Actions.Read, caslSubjects.Users, condition).because(
      'You cannot view this user',
    );
  }
};
