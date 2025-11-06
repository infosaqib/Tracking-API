import { Injectable } from '@nestjs/common';
import { permissionList } from './data/permission-list';
import { GetPermissions } from './dto/get-permissions.dto';
import { Permissions } from './dto/permissions.entity';
import { groupPermissions } from './helpers/formatPermission';

@Injectable()
export class PermissionsService {
  findAll(input: GetPermissions) {
    const keys = Object.keys(input);

    const filteredPermissions = permissionList.filter((item) => {
      // eslint-disable-next-line no-restricted-syntax
      for (const key of keys) {
        if (item[key] !== input[key]) {
          return false;
        }
      }
      return true;
    });

    return groupPermissions(filteredPermissions);
  }

  findOne(id: Permissions['id']) {
    return permissionList.find((item) => item.id === id);
  }
}
