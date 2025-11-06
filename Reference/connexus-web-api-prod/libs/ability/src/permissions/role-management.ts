import { TenantTypes } from '@prisma/client';
import { getUserType } from 'src/services/permissions/data/utils/utils';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import { VendorManagementTypeSelector } from '../helpers/vendor-managment-type-selector';
import { Actions } from '../types/actions';
import { RolesWhereInput } from '../types/casl-prisma-where-input.type';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';

/**
 * Sets up role management permissions based on the user type and available permissions
 * @param input Permission input containing user context and permission maps
 */
export const roleManagementPermissions = (
  input: CreatePermissionInput,
): void => {
  const { permissionMap, ability, userType, readableTenants, writableTenants } =
    input;
  const { can } = ability;

  // Get all role management permissions
  const clientRolePermissions = permissionMap.get(
    permissionType.clientRoleManagement,
  );
  const vendorRolePermissions = permissionMap.get(
    permissionType.vendorRoleManagement,
  );

  // Exit early if no permissions are available
  if (!clientRolePermissions && !vendorRolePermissions) {
    return;
  }

  const { isConnexus, isClient } = getUserType(userType);

  // Set up tenant selector for determining allowed tenant types
  const tenantSelector = new VendorManagementTypeSelector({
    vendorPermissionMap: vendorRolePermissions,
    branchPermissionMap: vendorRolePermissions,
    franchisePermissionMap: vendorRolePermissions,
    clientPermissionMap: clientRolePermissions,
  });

  // Get allowed tenant types for each action
  const viewTenantTypes: TenantTypes[] = tenantSelector.viewTenantTypes();
  const createTenantTypes: TenantTypes[] = tenantSelector.createTenantTypes();
  const editTenantTypes: TenantTypes[] = tenantSelector.editTenantTypes();
  const deleteTenantTypes: TenantTypes[] = tenantSelector.deleteTenantTypes();

  // Base conditions for roles
  const baseCondition: RolesWhereInput = {
    deletedAt: null,
  };

  // Add tenant conditions based on user type
  if (!isConnexus) {
    // Non-Connexus users can only manage roles for their readable tenants
    baseCondition.tenantsId = {
      in: isClient ? readableTenants : writableTenants,
    };
  }

  // Helper function to create tenant-specific conditions
  const createTenantCondition = (
    tenantTypes: TenantTypes[],
  ): RolesWhereInput => {
    if (isConnexus || tenantTypes.length === 0) {
      return baseCondition;
    }

    return {
      ...baseCondition,
      tenant: {
        is: {
          type: {
            in: tenantTypes,
          },
          deletedAt: null,
        },
      },
    };
  };

  // Set up Create permission
  if (createTenantTypes.length > 0 || isConnexus) {
    can(
      Actions.Create,
      caslSubjects.Roles,
      createTenantCondition(createTenantTypes),
    ).because('You do not have permission to create roles');
  }

  // Set up Update permission
  if (editTenantTypes.length > 0 || isConnexus) {
    can(
      Actions.Update,
      caslSubjects.Roles,
      createTenantCondition(editTenantTypes),
    ).because('You do not have permission to edit this role');
  }

  // Set up Delete permission
  if (deleteTenantTypes.length > 0 || isConnexus) {
    can(
      Actions.Delete,
      caslSubjects.Roles,
      createTenantCondition(deleteTenantTypes),
    ).because('You do not have permission to delete this role');
  }

  // Set up Read permission
  if (viewTenantTypes.length > 0 || isConnexus) {
    const viewCondition: RolesWhereInput = isConnexus
      ? baseCondition
      : {
          ...baseCondition,
          tenantsId: {
            in: readableTenants,
          },
          tenant: {
            type: {
              in: viewTenantTypes,
            },
            deletedAt: null,
          },
        };

    can(Actions.Read, caslSubjects.Roles, viewCondition).because(
      'You do not have permission to view roles',
    );
  }
};
