export const permissionType = {
  connexusUserManagement: 'connexus_user_management',
  clientUserManagement: 'client_user_management',
  vendorUserManagement: 'vendor_user_management',
  connexusRoleManagement: 'connexus_role_management',
  clientRoleManagement: 'client_role_management',
  vendorRoleManagement: 'vendor_role_management',
  clientManagement: 'client_management',
  corporateContacts: 'corporate_contacts',
  propertyManagement: 'property_management',
  propertyContacts: 'property_contacts',
  serviceManagement: 'service_management',
  vendorManagement: 'vendor_management',
  vendorContacts: 'vendor_contacts',
  branchManagement: 'branch_management',
  branchContacts: 'branch_contacts',
  franchiseManagement: 'franchise_management',
  franchiseContacts: 'franchise_contacts',
} as const;

export type PermissionTypeKeys = keyof typeof permissionType;
export type PermissionTypeValues = (typeof permissionType)[PermissionTypeKeys];
