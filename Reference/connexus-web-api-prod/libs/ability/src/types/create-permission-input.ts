import { AbilityBuilder } from '@casl/ability';
import { TenantUserFilterTypes } from '@prisma/client';
import { PermissionTypeValues } from 'src/services/permissions/dto/permission-types';
import {
  PermissionActionType,
  PermissionType,
} from 'src/services/permissions/dto/permissions.entity';
import { getUserProperties } from '../helpers/get-user-properties';
import { AppAbility } from './casl-subjects';

export type UserProperties = Awaited<ReturnType<typeof getUserProperties>>;

export type CreatePermissionInput = {
  permissionMap: Map<PermissionTypeValues, PermissionActionType[]>;
  userType: PermissionType;
  ability: AbilityBuilder<AppAbility>;
  tenantId: string | null;
  childTenants: string[];
  readableTenants: string[];
  writableTenants: string[];
  properties: UserProperties;
  userTenantType: TenantUserFilterTypes;
};
