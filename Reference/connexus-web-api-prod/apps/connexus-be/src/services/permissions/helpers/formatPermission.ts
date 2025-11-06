import { Permissions } from '../dto/permissions.entity';

type SlimPermission = Omit<
  Permissions,
  'type' | 'moduleName' | 'screenName' | 'permission' | 'permissionType'
>;

const createSlimPermission = (permission: Permissions) => {
  return {
    id: permission.id,
    actionType: permission.actionType,
    requiredPermissions: permission.requiredPermissions,
    readOnly: permission.readOnly,
  } satisfies SlimPermission;
};

export const groupPermissions = (permissions: Permissions[]) => {
  const data: {
    moduleName: Permissions['moduleName'];
    screenName: Permissions['screenName'];
    type: Permissions['type'];
    permissions: {
      permission: string;
      actions: SlimPermission[];
      permissionType: Permissions['permissionType'];
    }[];
  }[] = [];

  permissions.forEach((permission) => {
    const moduleIndex = data.findIndex(
      (item) =>
        item.moduleName === permission.moduleName &&
        item.screenName === permission.screenName,
    );

    if (moduleIndex === -1) {
      data.push({
        moduleName: permission.moduleName,
        screenName: permission.screenName,
        type: permission.type,
        permissions: [
          {
            permission: permission.permission,
            actions: [createSlimPermission(permission)],
            permissionType: permission.permissionType,
          },
        ],
      });
    } else {
      const screenIndex = data[moduleIndex].permissions.findIndex(
        (item) => item.permission === permission.permission,
      );

      if (screenIndex === -1) {
        data[moduleIndex].permissions.push({
          permission: permission.permission,
          actions: [createSlimPermission(permission)],
          permissionType: permission.permissionType,
        });
      } else {
        data[moduleIndex].permissions[screenIndex].actions.push(
          createSlimPermission(permission),
        );
      }
    }
  });

  return data;
};
