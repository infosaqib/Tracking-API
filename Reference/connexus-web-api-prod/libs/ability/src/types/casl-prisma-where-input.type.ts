import { Model, PrismaQuery } from '@casl/prisma';
import { Roles, Users, UserTenants } from '@prisma/client';

export type UserWhereInput = PrismaQuery<Model<Users, 'Users'>>;
export type UserTenantsWhereInput = PrismaQuery<
  Model<UserTenants, 'VendorContact'>
>;
export type RolesWhereInput = PrismaQuery<Model<Roles, 'Roles'>>;
