import { RouteController } from '@app/shared';
import { Get, Query } from '@nestjs/common';
import { GetPermissions } from './dto/get-permissions.dto';
import { PermissionsService } from './permissions.service';

@RouteController('permissions')
export class PermissionsController {
  constructor(private permissionService: PermissionsService) {}

  @Get('/')
  find(@Query() query: GetPermissions) {
    return this.permissionService.findAll(query);
  }
}
