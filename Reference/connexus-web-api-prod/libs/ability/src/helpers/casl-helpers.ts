import { ForbiddenError } from '@casl/ability';
import { permissionMap } from 'src/services/permissions/data/permission-list';
import { PermissionTypeValues } from 'src/services/permissions/dto/permission-types';
import { PermissionActionType } from 'src/services/permissions/dto/permissions.entity';

import { Actions } from '../types/actions';
import { AppAbility, CaslSubject } from '../types/casl-subjects';

export const convertPermissionToMap = (
  userRoles: {
    roleId: string;
    role: {
      rolePermissions: {
        permissionsId: string;
      }[];
      id: string;
      name: string;
    };
  }[],
) => {
  const permissions = Array.from(
    new Set(
      userRoles.flatMap((d) =>
        d.role.rolePermissions.map((r) => r.permissionsId),
      ),
    ),
  ).map((permission) => {
    return permissionMap[permission];
  });

  const response = permissions.reduce((map, permission) => {
    const { permissionType, actionType } = permission;
    if (map.has(permissionType)) {
      if (!map.get(permissionType).includes(actionType)) {
        map.set(permissionType, [...map.get(permissionType), actionType]);
      }
    } else {
      map.set(permissionType, [actionType]);
    }
    return map;
  }, new Map<PermissionTypeValues, PermissionActionType[]>());

  return response;
};

export class ThrowCaslForbiddenError {
  static from(ability: AppAbility) {
    return {
      throwUnlessCan: (
        action: Actions,
        subject: CaslSubject,
        field?: string,
      ) => {
        ForbiddenError.from(ability)
          .setMessage('You are not authorized to perform this action')
          .throwUnlessCan(action, subject, field);
      },
    };
  }
}
