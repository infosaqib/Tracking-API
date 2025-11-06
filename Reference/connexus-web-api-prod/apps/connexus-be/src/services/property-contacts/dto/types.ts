import { Actions } from '@app/ability';
import { RequestUser } from '@app/shared';
import { ClientProperties, Prisma } from '@prisma/client';

export type PropertyPermissionCheckInput = {
  property: ClientProperties;
  user: RequestUser;
  action: Actions;
};

export type PropertyContactPermissionCheckInput = {
  propertyContact: Prisma.PropertyContactsWhereInput;
  user: RequestUser;
  action: Actions;
};
