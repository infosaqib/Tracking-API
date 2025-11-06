import { PermissionActionType } from 'src/services/permissions/dto/permissions.entity';
import { permissionType } from '../../dto/permission-types';
import { PermissionType } from '../../dto/permissions.entity';
import { ClientTeamPermissions } from '../client-team-permissions';
import { ConnexusTeamPermissions } from '../connexus-team-permissions';
import { VendorBranchTeamPermissions } from '../vendor-branch-team-permissions';
import { VendorFranchiseTeamPermissions } from '../vendor-franchise-team-permissions';
import { VendorTeamPermissions } from '../vendor-team-permissions';

export const getClientAdminPermissions = () => {
  return ClientTeamPermissions.filter(
    (permission) => !permission.donOtAddToAdmin,
  );
};

export const getConnexusAdminPermissions = () => {
  return ConnexusTeamPermissions.filter(
    (permission) => !permission.donOtAddToAdmin,
  );
};

export const getConnexusSuperAdminPermissions = () => {
  return ConnexusTeamPermissions;
};

export const getVendorAdminPermissions = () => {
  return VendorTeamPermissions.filter(
    (permission) => !permission.donOtAddToAdmin,
  );
};

export const getVendorBranchAdminPermissions = () => {
  return VendorBranchTeamPermissions.filter(
    (permission) => !permission.donOtAddToAdmin,
  );
};

export const getVendorFranchiseAdminPermissions = () => {
  return VendorFranchiseTeamPermissions.filter(
    (permission) => !permission.donOtAddToAdmin,
  );
};

export const isFalse = (b: boolean | undefined) => b === false;

export const uniqueArray = <T = string>(array: T[]) => {
  return [...new Set(array)];
};

export const getUserType = (type: PermissionType) => {
  return {
    isConnexus: type === PermissionType.connexus,
    isClient: type === PermissionType.client,
    isVendor: type === PermissionType.vendor,
  };
};

export const getpPopertyMangerPermissions = () => {
  const permissions: Array<{
    permissionType: string;
    actionType: PermissionActionType;
    type: PermissionType;
  }> = [
    {
      permissionType: permissionType.corporateContacts,
      actionType: 'Create',
      type: PermissionType.client,
    },
    {
      permissionType: permissionType.corporateContacts,
      actionType: 'View',
      type: PermissionType.client,
    },
    {
      permissionType: permissionType.corporateContacts,
      actionType: 'Edit',
      type: PermissionType.client,
    },
    {
      permissionType: permissionType.corporateContacts,
      actionType: 'Delete',
      type: PermissionType.client,
    },
    {
      permissionType: permissionType.clientManagement,
      actionType: 'View',
      type: PermissionType.client,
    },

    {
      permissionType: permissionType.propertyManagement,
      actionType: 'View',
      type: PermissionType.client,
    },
    {
      permissionType: permissionType.propertyManagement,
      actionType: 'Edit',
      type: PermissionType.client,
    },
    {
      permissionType: permissionType.propertyContacts,
      actionType: 'Create',
      type: PermissionType.client,
    },
    {
      permissionType: permissionType.propertyContacts,
      actionType: 'View',
      type: PermissionType.client,
    },
    {
      permissionType: permissionType.propertyContacts,
      actionType: 'Edit',
      type: PermissionType.client,
    },
    {
      permissionType: permissionType.propertyContacts,
      actionType: 'Delete',
      type: PermissionType.client,
    },
    {
      permissionType: permissionType.serviceManagement,
      actionType: 'View',
      type: PermissionType.client,
    },
  ];

  const filteredPermissions = getClientAdminPermissions().filter((permission) =>
    permissions.some(
      (p) =>
        p.permissionType === permission.permissionType &&
        p.actionType === permission.actionType,
    ),
  );

  return filteredPermissions;
};
