import { clientCorporateContactManagementPermissions } from './client-corporate-contact-management';
import { clientManagementPermissions } from './client-management';
import { contractManagement } from './contract-permissions';
import { clientPropertyContactManagementPermissions } from './property-contact-management';
import { clientPropertyManagementPermissions } from './property-management';
import { roleManagementPermissions } from './role-management';
import { serviceManagementPermissions } from './service-management';
import { userManagementPermissions } from './user-management';
import { vendorContactManagementPermissions } from './vendor-contact-managment';
import { vendorManagement } from './vendor-management';

export const permissionHandlers = [
  userManagementPermissions,
  clientCorporateContactManagementPermissions,
  vendorContactManagementPermissions,
  roleManagementPermissions,
  clientManagementPermissions,
  clientPropertyManagementPermissions,
  clientPropertyContactManagementPermissions,
  serviceManagementPermissions,
  vendorManagement,
  contractManagement,
] as const;
