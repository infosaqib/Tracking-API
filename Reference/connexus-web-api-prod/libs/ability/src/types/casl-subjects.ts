import { AbilityBuilder, PureAbility } from '@casl/ability';
import { PrismaQuery, Subjects } from '@casl/prisma';
import {
  Client,
  ClientProperties,
  Contracts,
  PropertyContacts,
  Roles,
  Services,
  Users,
  UserTenants,
  Vendors,
} from '@prisma/client';

export const caslSubjects = {
  Users: 'Users',
  Roles: 'Roles',
  Client: 'Client',
  Property: 'Property',
  PropertyContact: 'PropertyContact',
  UserTenants: 'UserTenants',
  CorporateContact: 'CorporateContact',
  Service: 'Service',
  Vendor: 'Vendor',
  VendorBranch: 'VendorBranch',
  VendorContact: 'VendorContact',
  VendorFranchise: 'VendorFranchise',
  Contract: 'Contract',
} as const;

export type CaslSubject = Subjects<{
  [caslSubjects.Users]: Users;
  [caslSubjects.Roles]: Roles;
  [caslSubjects.Client]: Client;
  [caslSubjects.Property]: ClientProperties;
  [caslSubjects.PropertyContact]: PropertyContacts;
  [caslSubjects.UserTenants]: UserTenants;
  [caslSubjects.CorporateContact]: Users;
  [caslSubjects.Service]: Services;
  [caslSubjects.Vendor]: Vendors;
  [caslSubjects.VendorBranch]: Vendors;
  [caslSubjects.VendorContact]: UserTenants;
  [caslSubjects.VendorFranchise]: Vendors;
  [caslSubjects.Contract]: Contracts;
}>;

export type AppAbility = PureAbility<[string, CaslSubject], PrismaQuery>;
export type AppAbilityBuilder = AbilityBuilder<AppAbility>;
