import { subject } from '@casl/ability';
import { Client, Prisma } from '@prisma/client';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import { PermissionType } from 'src/services/permissions/dto/permissions.entity';
import { Actions } from '../types/actions';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';

export const clientManagementPermissions = (input: CreatePermissionInput) => {
  const {
    permissionMap,
    userType,
    ability,
    tenantId,
    readableTenants: allTenants,
  } = input;
  const { can, cannot } = ability;

  if (userType === PermissionType.vendor) {
    return;
  }

  const permissions = permissionMap.get(permissionType.clientManagement);

  const condition: Prisma.ClientWhereInput = {};

  if (!permissions) {
    return;
  }

  if (userType === PermissionType.client) {
    condition.tenantId = tenantId;

    cannot(Actions.Manage, caslSubjects.Client, {
      tenantId: {
        notIn: allTenants,
      },
    });
  }

  if (permissions.includes('Create')) {
    can(Actions.Create, caslSubjects.Client, condition);
  }

  if (permissions.includes('Edit')) {
    can(Actions.Update, caslSubjects.Client, condition);
  }

  if (permissions.includes('Delete')) {
    can(Actions.Delete, caslSubjects.Client, condition);
  }

  if (permissions.includes('View')) {
    // Give permission to view child tenants
    if (userType === PermissionType.client) {
      condition.tenantId = {
        in: allTenants,
      };
    }

    can(Actions.Read, caslSubjects.Client, condition);
  }
};

export const createClientSubject = (client: any) => {
  if (!client.tenantId) {
    throw new Error('Tenant ID is required');
  }

  return subject(caslSubjects.Client, client as Client);
};
