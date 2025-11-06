import { TenantTypes } from '@prisma/client';
import { PermissionActionType } from 'src/services/permissions/dto/permissions.entity';

export class VendorManagementTypeSelector {
  private vendorPermissionMap?: PermissionActionType[];

  private branchPermissionMap?: PermissionActionType[];

  private franchisePermissionMap?: PermissionActionType[];

  private clientPermissionMap?: PermissionActionType[];

  constructor(input: {
    vendorPermissionMap?: PermissionActionType[];
    branchPermissionMap?: PermissionActionType[];
    franchisePermissionMap?: PermissionActionType[];
    clientPermissionMap?: PermissionActionType[];
  }) {
    this.vendorPermissionMap = input.vendorPermissionMap;
    this.branchPermissionMap = input.branchPermissionMap;
    this.franchisePermissionMap = input.franchisePermissionMap;
    this.clientPermissionMap = input.clientPermissionMap;
  }

  public allowedTenantTypes(action: PermissionActionType) {
    const allowedTenantTypes: TenantTypes[] = [];

    if (
      this.vendorPermissionMap &&
      this.vendorPermissionMap?.includes(action)
    ) {
      allowedTenantTypes.push(TenantTypes.VENDOR);
    }

    if (
      this.branchPermissionMap &&
      this.branchPermissionMap?.includes(action)
    ) {
      allowedTenantTypes.push(TenantTypes.VENDOR_BRANCH);
    }

    if (
      this.franchisePermissionMap &&
      this.franchisePermissionMap?.includes(action)
    ) {
      allowedTenantTypes.push(TenantTypes.VENDOR_FRANCHISE);
    }

    if (
      this.clientPermissionMap &&
      this.clientPermissionMap?.includes(action)
    ) {
      allowedTenantTypes.push(TenantTypes.CLIENT);
    }

    return allowedTenantTypes;
  }

  public viewTenantTypes = () => this.allowedTenantTypes('View');

  public createTenantTypes = () => this.allowedTenantTypes('Create');

  public editTenantTypes = () => this.allowedTenantTypes('Edit');

  public deleteTenantTypes = () => this.allowedTenantTypes('Delete');
}
