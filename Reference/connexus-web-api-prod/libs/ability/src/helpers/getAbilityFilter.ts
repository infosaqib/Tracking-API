import { RequestUser } from '@app/shared';
import { ExtractSubjectType } from '@casl/ability';
import { accessibleBy } from '@casl/prisma';
import { Actions } from '../types/actions';
import { CaslSubject } from '../types/casl-subjects';

export function getAbilityFilters<T>(input: {
  subject: ExtractSubjectType<CaslSubject>;
  condition: T;
  user: RequestUser;
}) {
  const { subject, condition, user } = input;
  const { ability } = user;

  const accessibility = accessibleBy(ability)[subject];
  return {
    AND: [accessibility, condition],
  } as T;
}

export function getUserRules(input: {
  subject: ExtractSubjectType<CaslSubject>;
  user: RequestUser;
  action: Actions;
  inverted?: boolean;
}) {
  const { subject, user, action, inverted } = input;
  const { ability } = user;

  const rules = ability
    .rulesFor(action, subject)
    .filter((rule) => rule.inverted === inverted)
    .map((d) => d.conditions);

  return rules;
}
