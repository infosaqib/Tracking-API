import { Actions } from '@app/ability';
import { RequestUser } from '@app/shared';
import { Vendors } from '@prisma/client';

export type VendorPermissionCheckInput = {
  vendor: Vendors;
  user: RequestUser;
  action: Actions;
};
