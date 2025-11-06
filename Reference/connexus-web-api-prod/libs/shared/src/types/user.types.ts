import { AppAbility } from '@app/ability';
import { PermissionType } from 'src/services/permissions/dto/permissions.entity';

export type RequestUser = {
  Username: string;
  email: string;
  email_verified: boolean;
  name: string;
  family_name: string;
  given_name: string;
  tenant_id: string;
  connexus_user_id: string;
  user_type: PermissionType;
  sub: string;
  ability: AppAbility;
  writableTenants?: string[];
  readableTenants?: string[];
};
