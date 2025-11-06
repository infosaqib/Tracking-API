import { PermissionTypeValues } from './permission-types';

export enum PermissionType {
  client = 'client',
  vendor = 'vendor',
  vendorFranchise = 'vendor_franchise',
  vendorBranch = 'vendor_branch',
  connexus = 'connexus',
}

export class Permissions {
  type: PermissionType;

  id: string;

  moduleName: string;

  screenName: string;

  permission: string;

  permissionType: PermissionTypeValues;

  actionType: PermissionActionType;

  requiredPermissions: string[];

  readOnly: boolean;

  donOtAddToAdmin?: boolean;
}

export class ProcessedPermissions {
  moduleName: string;

  permission: string;

  type: PermissionType;

  screenName: string;

  actionType: string;
}

export type PermissionActionType = 'Create' | 'Edit' | 'View' | 'Delete';
