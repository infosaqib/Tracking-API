import { Prisma, TenantTypes } from '@prisma/client';
import { getUserType } from 'src/services/permissions/data/utils/utils';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import { PermissionType } from 'src/services/permissions/dto/permissions.entity';
import { VendorManagementTypeSelector } from '../helpers/vendor-managment-type-selector';
import { Actions } from '../types/actions';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';

/**
 * Sets up vendor management permissions based on the user type and available permissions
 * @param input Permission input containing user context and permission maps
 */
export const vendorManagement = (input: CreatePermissionInput): void => {
  const { permissionMap, userType, ability, readableTenants, writableTenants } =
    input;
  const { can, cannot } = ability;

  // Exit early for client users
  if (userType === PermissionType.client) {
    return;
  }

  // Get all vendor management permissions
  const vendorPermissions = permissionMap.get(permissionType.vendorManagement);
  const branchPermissions = permissionMap.get(permissionType.branchManagement);
  const franchisePermissions = permissionMap.get(
    permissionType.franchiseManagement,
  );

  // Exit early if no permissions are available
  if (!vendorPermissions && !branchPermissions && !franchisePermissions) {
    return;
  }

  const { isConnexus } = getUserType(userType);

  // Set up tenant selector for determining allowed tenant types
  const typeSelector = new VendorManagementTypeSelector({
    vendorPermissionMap: vendorPermissions,
    branchPermissionMap: branchPermissions,
    franchisePermissionMap: franchisePermissions,
  });

  // Get allowed tenant types for each action
  const viewTenantTypes: TenantTypes[] = typeSelector.viewTenantTypes();
  const createTenantTypes: TenantTypes[] = typeSelector.createTenantTypes();
  const editTenantTypes: TenantTypes[] = typeSelector.editTenantTypes();
  const deleteTenantTypes: TenantTypes[] = typeSelector.deleteTenantTypes();

  if (createTenantTypes.includes(TenantTypes.VENDOR_BRANCH)) {
    can(Actions.Create, caslSubjects.VendorBranch);
  }
  if (createTenantTypes.includes(TenantTypes.VENDOR_FRANCHISE)) {
    can(Actions.Create, caslSubjects.VendorFranchise);
  }

  // Base conditions for vendors
  const baseCondition: Prisma.VendorsWhereInput = {
    tenant: {
      deletedAt: null,
    },
  };

  // Add tenant conditions based on user type
  if (!isConnexus) {
    baseCondition.tenant.id = {
      in: writableTenants,
    };

    // Prevent managing vendors for tenants the user doesn't have access to
    cannot(Actions.Manage, caslSubjects.Vendor, {
      tenant: {
        id: {
          notIn: readableTenants,
        },
      },
    }).because('You do not have permission to manage these vendors');
  }

  // Helper function to create tenant-specific conditions
  const createTenantCondition = (
    tenantTypes: TenantTypes[],
  ): Prisma.VendorsWhereInput => {
    if (isConnexus) {
      return baseCondition;
    }

    return {
      AND: [
        baseCondition,
        {
          tenant: {
            type: {
              in: tenantTypes,
            },
          },
        },
      ],
    };
  };

  // Set up Create permission
  if (createTenantTypes.length > 0 || isConnexus) {
    can(
      Actions.Create,
      caslSubjects.Vendor,
      isConnexus ? {} : createTenantCondition(createTenantTypes),
    ).because('You do not have permission to create vendors');
  }

  // Set up Update permission
  if (editTenantTypes.length > 0 || isConnexus) {
    can(
      Actions.Update,
      caslSubjects.Vendor,
      isConnexus ? {} : createTenantCondition(editTenantTypes),
    ).because('You do not have permission to edit this vendor');
  }

  // Set up Delete permission
  if (deleteTenantTypes.length > 0 || isConnexus) {
    can(
      Actions.Delete,
      caslSubjects.Vendor,
      isConnexus ? {} : createTenantCondition(deleteTenantTypes),
    ).because('You do not have permission to delete this vendor');
  }

  // Set up Read permission
  if (viewTenantTypes.length > 0 || isConnexus) {
    const viewCondition: Prisma.VendorsWhereInput = isConnexus
      ? {}
      : {
          tenant: {
            id: { in: readableTenants },
            type: { in: viewTenantTypes },
            deletedAt: null,
          },
        };

    can(Actions.Read, caslSubjects.Vendor, viewCondition).because(
      'You do not have permission to view vendors',
    );
  }
};
