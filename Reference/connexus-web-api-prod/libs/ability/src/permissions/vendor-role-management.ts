import { Prisma, TenantTypes } from '@prisma/client';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import { PermissionType } from 'src/services/permissions/dto/permissions.entity';
import { Actions } from '../types/actions';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';

export const vendorRoleManagementPermissions = (
  input: CreatePermissionInput,
) => {
  const { permissionMap, userType, ability, writableTenants, readableTenants } =
    input;
  const { can, cannot } = ability;

  if (userType === PermissionType.client) {
    return;
  }

  const permissions = permissionMap.get(permissionType.vendorRoleManagement);

  if (!permissions) {
    return;
  }

  const condition: Prisma.RolesWhereInput = {
    tenantsId: {
      in: writableTenants,
    },
    deletedAt: null,
    tenant: {
      type: {
        in: [
          TenantTypes.VENDOR,
          TenantTypes.VENDOR_BRANCH,
          TenantTypes.VENDOR_FRANCHISE,
        ],
      },
      deletedAt: null,
    },
  };

  if (userType === PermissionType.connexus) {
    condition.tenantsId = undefined;
  } else {
    cannot(Actions.Manage, caslSubjects.Roles, {
      tenantsId: {
        notIn: readableTenants,
      },
    }).because('You do not have permission to manage these vendor roles');
  }

  if (permissions.includes('Create')) {
    can(Actions.Create, caslSubjects.Roles, condition).because(
      'You do not have permission to create vendor roles',
    );
  }

  if (permissions.includes('Edit')) {
    can(Actions.Update, caslSubjects.Roles, condition).because(
      'You do not have permission to edit this vendor role',
    );
  }

  if (permissions.includes('Delete')) {
    can(Actions.Delete, caslSubjects.Roles, condition).because(
      'You do not have permission to delete this vendor role',
    );
  }

  if (permissions.includes('View')) {
    const viewCondition: Prisma.RolesWhereInput = {
      ...condition,
      tenantsId: {
        in: readableTenants,
      },
    };

    can(Actions.Read, caslSubjects.Roles, viewCondition).because(
      'You do not have permission to view vendor roles',
    );
  }
};
