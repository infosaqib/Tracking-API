import { Actions, AppAbility, CaslSubject } from '@app/ability';
import { PolicyGuard } from '@app/guards';
import { ExtractSubjectType } from '@casl/ability';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { CheckPolicies } from '../check-policies/check-policies.decorator';

/**
 * Permission definition with subject and action
 */
export interface Permission {
  subject: ExtractSubjectType<CaslSubject>;
  action: Actions;
}

/**
 * Decorator that checks if the user has at least one of the specified permissions
 * @param permissions Array of permissions (subject and action pairs)
 * @returns Decorator that applies policy guard with OR logic for permissions
 */
export const HasOneOfPermission = (permissions: Permission[]) => {
  return applyDecorators(
    UseGuards(PolicyGuard),
    CheckPolicies((ability: AppAbility) => {
      return permissions.some((permission) => {
        return ability.can(permission.action, permission.subject);
      });
    }),
  );
};
