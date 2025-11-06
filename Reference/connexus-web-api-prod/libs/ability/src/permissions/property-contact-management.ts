import { subject } from '@casl/ability';
import { Logger } from '@nestjs/common';
import { Prisma, PropertyContacts } from '@prisma/client';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import { PermissionType } from 'src/services/permissions/dto/permissions.entity';
import { validateMissingFields } from '../helpers/validate-mising-fields';
import { Actions } from '../types/actions';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';
import { getManageableProperties } from './utils/getManagableProperties';

const logger = new Logger('Property Contact Management Permissions');

export const clientPropertyContactManagementPermissions = (
  input: CreatePermissionInput,
) => {
  const { permissionMap, userType, ability, properties, userTenantType } =
    input;

  const ownProperties = properties.propertyIds;
  const childProperties = properties.childTenantProperties;

  logger.debug(
    `Checking permissions for user ${userType} with properties \n ${JSON.stringify(
      {
        properties,
      },
    )}`,
  );

  const permissions = permissionMap.get(permissionType.propertyContacts);

  if (!permissions) {
    return;
  }

  const { can, cannot } = ability;

  if (userType === PermissionType.vendor) {
    cannot(Actions.Manage, caslSubjects.PropertyContact);
    return;
  }

  const condition: Prisma.PropertyContactsWhereInput = {};

  const propertiesUserCanManage: string[] = getManageableProperties(
    properties,
    userTenantType,
    ownProperties,
  );

  if (userType === PermissionType.client) {
    condition.propertyId = {
      in: propertiesUserCanManage,
    };
  }

  if (userType !== PermissionType.connexus) {
    cannot(Actions.Manage, caslSubjects.PropertyContact, {
      propertyId: {
        notIn: propertiesUserCanManage,
      },
    });
  }

  if (permissions.includes('Create')) {
    can(Actions.Create, caslSubjects.PropertyContact, condition);
  }

  if (permissions.includes('Edit')) {
    can(Actions.Update, caslSubjects.PropertyContact, condition);
  }

  if (permissions.includes('Delete')) {
    can(Actions.Delete, caslSubjects.PropertyContact, condition);
  }

  if (permissions.includes('View')) {
    // Give permission to view child tenants
    if (userType === PermissionType.client) {
      condition.propertyId = {
        in: [...ownProperties, ...childProperties],
      };
    }

    can(Actions.Read, caslSubjects.PropertyContact, condition);
  }
};

export const createPropertyContactSubject = (propertyContact: any) => {
  validateMissingFields(propertyContact, ['propertyId']);
  return subject(
    caslSubjects.PropertyContact,
    propertyContact as PropertyContacts,
  );
};
