import { TenantTypes } from '@prisma/client';
import {
  getUserType,
  uniqueArray,
} from 'src/services/permissions/data/utils/utils';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import {
  PermissionActionType,
  PermissionType,
} from 'src/services/permissions/dto/permissions.entity';
import { VendorManagementTypeSelector } from '../helpers/vendor-managment-type-selector';
import { Actions } from '../types/actions';
import { UserWhereInput } from '../types/casl-prisma-where-input.type';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';

/**
 * Sets up user management permissions based on the user type and available permissions
 * @param input Permission input containing user context and permission maps
 */
export const userManagementPermissions = (
  input: CreatePermissionInput,
): void => {
  const { permissionMap, ability, userType, readableTenants, writableTenants } =
    input;
  const { can, cannot } = ability;

  // Get all user management permissions
  const clientUserPermissions = permissionMap.get(
    permissionType.clientUserManagement,
  );
  let vendorUserPermissions =
    permissionMap.get(permissionType.vendorUserManagement) || [];

  const connexusUserPermissions = permissionMap.get(
    permissionType.connexusUserManagement,
  );

  const branchUserManagementPermissions = permissionMap.get(
    permissionType.branchContacts,
  );

  const franchiseUserManagementPermissions = permissionMap.get(
    permissionType.franchiseContacts,
  );

  // Handle vendor contact management permissions
  if (
    [
      PermissionType.vendor,
      PermissionType.vendorBranch,
      PermissionType.vendorFranchise,
    ].includes(userType)
  ) {
    const vendorContactManagementPermissions = permissionMap.get(
      permissionType.vendorContacts,
    );

    if (
      vendorContactManagementPermissions &&
      vendorContactManagementPermissions.length > 0
    ) {
      vendorUserPermissions = uniqueArray<PermissionActionType>([
        ...(vendorUserPermissions || []),
        ...vendorContactManagementPermissions,
      ]);
    }
  }

  // Exit early if no permissions are available
  if (
    !clientUserPermissions &&
    !vendorUserPermissions &&
    !connexusUserPermissions
  ) {
    return;
  }

  const { isConnexus, isClient } = getUserType(userType);

  // Set up tenant selector for determining allowed tenant types
  const tenantSelector = new VendorManagementTypeSelector({
    vendorPermissionMap: vendorUserPermissions,
    branchPermissionMap: branchUserManagementPermissions,
    franchisePermissionMap: franchiseUserManagementPermissions,
    clientPermissionMap: clientUserPermissions,
  });

  // Get allowed tenant types for each action
  const viewTenantTypes: TenantTypes[] = tenantSelector.viewTenantTypes();
  const createTenantTypes: TenantTypes[] = tenantSelector.createTenantTypes();
  const editTenantTypes: TenantTypes[] = tenantSelector.editTenantTypes();
  const deleteTenantTypes: TenantTypes[] = tenantSelector.deleteTenantTypes();

  // Base conditions for non-Connexus users
  let conditions: UserWhereInput = {};

  if (!isConnexus) {
    conditions = {
      userTenants: {
        some: {
          tenantId: {
            in: isClient ? readableTenants : writableTenants,
          },
        },
      },
    };

    cannot(Actions.Manage, caslSubjects.Users, {
      userTenants: {
        none: {
          tenantId: {
            in: readableTenants,
          },
        },
      },
    }).because('You do not have permission to manage these users');
  }

  // Helper function to create tenant-specific conditions
  const createTenantCondition = (
    tenantTypes: TenantTypes[],
  ): UserWhereInput => {
    if (isConnexus || tenantTypes.length === 0) {
      return conditions;
    }

    return {
      ...conditions,
      userTenants: {
        some: {
          ...(conditions.userTenants?.some && {
            ...conditions.userTenants.some,
          }),
          tenant: {
            is: { type: { in: tenantTypes } },
          },
        },
      },
    };
  };

  // Set up Create permission
  if (createTenantTypes.length > 0 || isConnexus) {
    can(
      Actions.Create,
      caslSubjects.Users,
      createTenantCondition(createTenantTypes),
    );
  }

  // Set up Update permission
  if (editTenantTypes.length > 0 || isConnexus) {
    can(
      Actions.Update,
      caslSubjects.Users,
      createTenantCondition(editTenantTypes),
    );
  }

  // Set up Delete permission
  if (deleteTenantTypes.length > 0 || isConnexus) {
    can(
      Actions.Delete,
      caslSubjects.Users,
      createTenantCondition(deleteTenantTypes),
    );
  }

  // Set up Read permission
  if (viewTenantTypes.length > 0) {
    const viewCondition: UserWhereInput = isConnexus
      ? conditions
      : {
          ...conditions,
          userTenants: {
            some: {
              ...(conditions.userTenants?.some && {
                ...conditions.userTenants.some,
              }),
              tenantId: {
                in: readableTenants,
              },
              tenant: {
                is: {
                  type: { in: viewTenantTypes },
                },
              },
            },
          },
        };

    can(Actions.Read, caslSubjects.Users, viewCondition);
  }
};
