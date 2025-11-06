import { TenantTypes, VendorStages, VendorStatuses } from '@prisma/client';

export interface VendorResponse {
  tenantId: string;
  isPrimaryTenant: boolean;
  tenantType: TenantTypes;
  vendor: {
    id: string;
    name: string;
    stage: VendorStages;
    status: VendorStatuses;
    logo: string | null;
  };
}

export interface VendorWorkspaceResponse extends VendorResponse {
  branches?: VendorResponse[];
  franchises?: VendorResponse[];
}
