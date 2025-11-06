import { subject } from '@casl/ability';
import {
  ClientProperties,
  Prisma,
  TenantUserFilterTypes,
} from '@prisma/client';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import { PermissionType } from 'src/services/permissions/dto/permissions.entity';
import { validateMissingFields } from '../helpers/validate-mising-fields';
import { Actions } from '../types/actions';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';

export const clientPropertyManagementPermissions = (
  input: CreatePermissionInput,
) => {
  const {
    permissionMap,
    userType,
    ability,
    tenantId,
    readableTenants: allTenants,
    properties,
    userTenantType,
  } = input;

  const permissions = permissionMap.get(permissionType.propertyManagement);

  const ownProperties = properties.propertyIds;

  if (!permissions) {
    return;
  }

  const { can, cannot } = ability;

  if (userType === PermissionType.vendor) {
    cannot(Actions.Manage, caslSubjects.Property);
    return;
  }

  const condition: Prisma.ClientPropertiesWhereInput = {
    deletedAt: null,
  };

  if (userType === PermissionType.client) {
    condition.tenantId = {
      in: [tenantId],
    };

    // Can only manage own properties
    if (
      (
        [
          TenantUserFilterTypes.PROPERTY,
          TenantUserFilterTypes.MULTI_PROPERTY,
        ] as TenantUserFilterTypes[]
      ).includes(userTenantType)
    ) {
      condition.id = {
        in: ownProperties,
      };
    } else {
      condition.id = {
        in: [...properties.propertyIds, ...properties.childTenantProperties],
      };
    }
  }

  if (permissions.includes('Create')) {
    can(Actions.Create, caslSubjects.Property, condition);
  }

  if (permissions.includes('Edit')) {
    can(Actions.Update, caslSubjects.Property, condition);
  }

  if (permissions.includes('Delete')) {
    can(Actions.Delete, caslSubjects.Property, condition);
  }

  if (permissions.includes('View')) {
    // Give permission to view child tenants
    if (userType === PermissionType.client) {
      condition.tenantId = {
        in: allTenants,
      };
    }

    can(Actions.Read, caslSubjects.Property, condition);
  }
};

export const createPropertySubject = (property: any) => {
  validateMissingFields(property, ['id', 'tenantId']);
  return subject(caslSubjects.Property, property as ClientProperties);
};
