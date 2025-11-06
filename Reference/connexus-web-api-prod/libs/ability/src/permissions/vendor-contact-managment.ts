import { Model, PrismaQuery } from '@casl/prisma';
import { UserTenants } from '@prisma/client';
import { permissionType } from 'src/services/permissions/dto/permission-types';
import { PermissionType } from 'src/services/permissions/dto/permissions.entity';
import { VendorManagementTypeSelector } from '../helpers/vendor-managment-type-selector';
import { Actions } from '../types/actions';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';

type UserTenantsWhereInput = PrismaQuery<Model<UserTenants, 'VendorContact'>>;

export const vendorContactManagementPermissions = (
  input: CreatePermissionInput,
) => {
  const {
    permissionMap,
    userType,
    ability,
    writableTenants,
    readableTenants: allTenants,
  } = input;
  const { can } = ability;

  if (userType === PermissionType.client) {
    return;
  }

  const vendorContactsPermissions = permissionMap.get(
    permissionType.vendorContacts,
  );

  const vendorBranchContactPermissions = permissionMap.get(
    permissionType.branchContacts,
  );

  const vendorFranchiseContactPermissions = permissionMap.get(
    permissionType.franchiseContacts,
  );

  if (
    !vendorContactsPermissions &&
    !vendorBranchContactPermissions &&
    !vendorFranchiseContactPermissions
  ) {
    return;
  }

  const tenantSelector = new VendorManagementTypeSelector({
    vendorPermissionMap: vendorContactsPermissions,
    branchPermissionMap: vendorBranchContactPermissions,
    franchisePermissionMap: vendorFranchiseContactPermissions,
  });

  const condition: UserTenantsWhereInput = {
    tenant:
      userType !== PermissionType.connexus
        ? {
            is: {
              id: { in: writableTenants },
            },
          }
        : undefined,
  };

  const viewTenantTypes = tenantSelector.viewTenantTypes();
  const createTenantTypes = tenantSelector.createTenantTypes();
  const editTenantTypes = tenantSelector.editTenantTypes();
  const deleteTenantTypes = tenantSelector.deleteTenantTypes();

  if (viewTenantTypes.length === 0) {
    return;
  }

  // Create Permission
  if (createTenantTypes.length > 0) {
    const c = {
      ...condition,
      tenant: {
        is: {
          ...(condition?.tenant?.is ? condition.tenant.is : {}),
          type: {
            in: createTenantTypes,
          },
        },
      },
    };

    can(Actions.Create, caslSubjects.VendorContact, c);
  }

  // Edit Permission
  if (editTenantTypes.length > 0) {
    can(Actions.Update, caslSubjects.VendorContact, {
      ...condition,
      tenant: {
        is: {
          ...(condition?.tenant?.is ? condition.tenant.is : {}),
          type: { in: editTenantTypes },
        },
      },
    });
  }

  // Delete Permission
  if (deleteTenantTypes.length > 0) {
    can(Actions.Delete, caslSubjects.VendorContact, {
      ...condition,
      tenant: {
        is: {
          ...(condition?.tenant?.is ? condition.tenant.is : {}),
          type: { in: deleteTenantTypes },
        },
      },
    });
  }

  // View Permission
  if (viewTenantTypes.length > 0) {
    const viewCondition: UserTenantsWhereInput = {
      ...condition,
      tenant: {
        is: {
          ...(condition?.tenant?.is ? condition.tenant.is : {}),
          id:
            userType === PermissionType.connexus
              ? undefined
              : {
                  in: allTenants,
                },

          type: {
            in: viewTenantTypes,
          },
        },
      },
    };
    can(Actions.Read, caslSubjects.VendorContact, viewCondition);
  }
};
