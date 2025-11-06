import { permissionList } from 'src/services/permissions/data/permission-list';
import { Permissions } from 'src/services/permissions/dto/permissions.entity';

export const isValidPermissionIds = (
  permissionIds: string[],
  type: Permissions['type'],
) => {
  return permissionIds.every((permissionId) => {
    const permission = permissionList.find(
      (_permission) => _permission.id === permissionId,
    );

    return permission?.type === type;
  });
};
