import { TenantUserFilterTypes } from '@prisma/client';
import { UserProperties } from '../../types/create-permission-input';

export const getManageableProperties = (
  properties: UserProperties,
  userTenantType: TenantUserFilterTypes,
  ownProperties: string[],
) => {
  return (
    [
      TenantUserFilterTypes.PROPERTY,
      TenantUserFilterTypes.MULTI_PROPERTY,
    ] as TenantUserFilterTypes[]
  ).includes(userTenantType)
    ? ownProperties
    : [...properties.propertyIds, ...properties.childTenantProperties];
};
