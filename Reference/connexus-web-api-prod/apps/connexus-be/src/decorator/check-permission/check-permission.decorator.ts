import { Actions, AppAbility, CaslSubject } from '@app/ability';
import { PolicyGuard } from '@app/guards';
import { ExtractSubjectType } from '@casl/ability';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { CheckPolicies } from '../check-policies/check-policies.decorator';

export const CheckPermission = (
  subject: ExtractSubjectType<CaslSubject> | ExtractSubjectType<CaslSubject>[],
  action: Actions,
) => {
  return applyDecorators(
    UseGuards(PolicyGuard),
    CheckPolicies((ability: AppAbility) => {
      if (Array.isArray(subject)) {
        return subject.some((s) => ability.can(action, s));
      }
      return ability.can(action, subject);
    }),
  );
};
