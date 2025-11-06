import { TenantTypes, VendorStages, VendorStatuses } from '@prisma/client';
import { VendorResponse } from '../entities/vendor.entity';

export const baseVendorSelect = (userId?: string) =>
  ({
    id: true,
    name: true,
    stage: true,
    status: true,
    parentCompanyId: true,
    logo: true,
    tenant: {
      select: {
        id: true,
        name: true,
        type: true,
        userTenants: {
          where: {
            userId: userId || undefined,
          },
          select: {
            isPrimaryTenant: true,
          },
        },
      },
    },
  }) as const;

export type VendorBase = {
  id: string;
  name: string;
  stage: VendorStages;
  status: VendorStatuses;
  parentCompanyId: string | null;
  logo: string | null;
  tenant: {
    id: string;
    name: string;
    type: TenantTypes;
    userTenants: { isPrimaryTenant: boolean }[];
  };
};

export type VendorChild = {
  id: string;
  name: string;
  stage: VendorStages;
  status: VendorStatuses;
  logo: string | null;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    type: TenantTypes;
  };
};

export const transformVendorBase = (vendor: VendorBase) => {
  return {
    tenantId: vendor.tenant.id,
    tenantType: vendor.tenant.type,
    isPrimaryTenant: vendor.tenant.userTenants[0]?.isPrimaryTenant || false,
    isParentCompany: vendor.parentCompanyId !== null,
    logo: vendor.logo,
    vendor: {
      id: vendor.id,
      name: vendor.name,
      stage: vendor.stage,
      status: vendor.status,
      logo: vendor.logo,
    },
  };
};

export const transformChildCompany = (child: VendorChild) => {
  return {
    vendor: {
      id: child.id,
      name: child.name,
      stage: child.stage,
      status: child.status,
      logo: child.logo,
    },
    tenantId: child.tenantId,
    tenantType: child.tenant.type,
    isPrimaryTenant: false,
  } satisfies VendorResponse;
};
