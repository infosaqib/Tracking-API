import { Actions, caslSubjects } from '@app/ability';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { GetRolesDto } from './dto/get-role.dto';
import { DeleteRolesDto } from './dto/remove-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@RouteController('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @CheckPermission(caslSubjects.Roles, Actions.Delete)
  create(
    @Body() createRoleDto: CreateRoleDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.rolesService.create(createRoleDto, user);
  }

  @Get()
  @CheckPermission(caslSubjects.Roles, Actions.Read)
  async findAll(
    @Query() query: GetRolesDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.rolesService.findAll(query, user);
  }

  @Get(':id')
  @CheckPermission(caslSubjects.Roles, Actions.Read)
  findOne(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.rolesService.findOne(id, user);
  }

  @Patch(':id')
  @CheckPermission(caslSubjects.Roles, Actions.Update)
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.rolesService.update(id, updateRoleDto, user);
  }

  @Delete()
  @CheckPermission(caslSubjects.Roles, Actions.Delete)
  remove(
    @Query() deleteRolesDto: DeleteRolesDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.rolesService.remove(deleteRolesDto.ids, user);
  }
}
