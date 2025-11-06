import { subject } from '@casl/ability';
import { ForbiddenException } from '@nestjs/common';
import { Roles, Users } from '@prisma/client';

import { Actions } from '../types/actions';
import { AppAbility, CaslSubject, caslSubjects } from '../types/casl-subjects';

type ValidateSubjectArrayInput =
  | {
      type: typeof caslSubjects.Roles;
      subjectArray: Roles[];
    }
  | {
      type: typeof caslSubjects.Users;
      subjectArray: Users[];
    }
  | {
      type: typeof caslSubjects.CorporateContact;
      subjectArray: Users[];
    };

/**
 *
 * @param input
 * @param ability
 * @param action
 * @returns boolean
 */
export const validateSubjectArray = (
  input: ValidateSubjectArrayInput,
  ability: AppAbility,
  action: Actions,
) => {
  const array: CaslSubject[] = [];

  input.subjectArray.forEach((item) => {
    array.push(subject(input.type, item));
  });

  const hadPermission = array.every((item) => {
    return ability.can(action, item);
  });

  if (!hadPermission) {
    throw new ForbiddenException(
      'You are not authorized to perform this action',
    );
  }

  return hadPermission;
};
