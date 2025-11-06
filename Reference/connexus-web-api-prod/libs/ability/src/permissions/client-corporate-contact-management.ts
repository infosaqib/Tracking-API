import { subject } from '@casl/ability';
import { ContactType, Prisma, Users } from '@prisma/client';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import { PermissionType } from 'src/services/permissions/dto/permissions.entity';
import { Actions } from '../types/actions';
import { UserWhereInput } from '../types/casl-prisma-where-input.type';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';
import { processUserObject } from './utils/process-subject';

export const clientCorporateContactManagementPermissions = (
  input: CreatePermissionInput,
) => {
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

  const permissions = permissionMap.get(permissionType.corporateContacts);

  if (!permissions) {
    return;
  }

  const condition: UserWhereInput = {};

  if (userType === PermissionType.client) {
    condition.userTenants = {
      every: {
        tenantId,
        contactType: {
          in: [
            ContactType.PRIMARY_CONTACT,
            ContactType.SECONDARY_CONTACT,
            ContactType.ON_SITE_TEAM_USER,
          ],
        },
      },
    };
    cannot(Actions.Manage, caslSubjects.CorporateContact, {
      userTenants: {
        some: {
          tenantId: {
            notIn: allTenants,
          },
        },
      },
    } satisfies Prisma.UsersWhereInput);
  }

  if (permissions.includes('Create')) {
    can(Actions.Create, caslSubjects.CorporateContact, condition);
  }

  if (permissions.includes('Edit')) {
    can(Actions.Update, caslSubjects.CorporateContact, condition);
  }

  if (permissions.includes('Delete')) {
    can(Actions.Delete, caslSubjects.CorporateContact, condition);
  }

  if (permissions.includes('View')) {
    const viewCondition: UserWhereInput = condition;

    // Give permission to view child tenants
    if (userType === PermissionType.client) {
      viewCondition.userTenants = {
        some: {
          ...(condition.userTenants?.some || {}),
          tenantId: {
            in: allTenants,
          },
        },
      };
    }

    can(Actions.Read, caslSubjects.CorporateContact, viewCondition);
  }
};

export const createCorporateContactSubject = (user: any, process = false) => {
  let safeUser = { ...user };

  if (process) {
    safeUser = processUserObject(safeUser);
  }

  return subject(caslSubjects.CorporateContact, safeUser as Users);
};
