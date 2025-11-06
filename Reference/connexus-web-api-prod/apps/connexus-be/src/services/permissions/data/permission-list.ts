import { Permissions } from '../dto/permissions.entity';
import { ClientTeamPermissions } from './client-team-permissions';
import { ConnexusTeamPermissions } from './connexus-team-permissions';
import { VendorBranchTeamPermissions } from './vendor-branch-team-permissions';
import { VendorFranchiseTeamPermissions } from './vendor-franchise-team-permissions';
import { VendorTeamPermissions } from './vendor-team-permissions';

export const permissionList: Permissions[] = Object.freeze([
  ConnexusTeamPermissions,
  ClientTeamPermissions,
  VendorTeamPermissions,
  VendorFranchiseTeamPermissions,
  VendorBranchTeamPermissions,
]).flat();

export const permissionMap = permissionList.reduce(
  (acc, permission) => {
    acc[permission.id] = permission;
    return acc;
  },
  {} as Record<string, (typeof permissionList)[0]>,
);
