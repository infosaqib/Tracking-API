import { Actions, caslSubjects } from '@app/ability';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Body, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { CheckUserPermissionDto } from './dto/check-user-permission';
import { CreatePropertyDto } from './dto/create-property.dto';
import { ExportPropertyDto } from './dto/export-property.dto';
import { GetPropertyDto } from './dto/get-property.dto';
import { GetSelectedPropertiesDto } from './dto/get-selected-properties.dto';
import { GetUserPropertiesDto } from './dto/get-user-properties.dto';
import { UpdatePropertyPermissionDto } from './dto/update-property-permission.dto';
import {
  UpdatePropertyDto,
  UpdatePropertyStatusDto,
} from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@RouteController('properties', {
  security: 'protected',
})
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @CheckPermission(caslSubjects.Property, Actions.Create)
  @CheckPermission(caslSubjects.PropertyContact, Actions.Create)
  create(
    @Body() createPropertyDto: CreatePropertyDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertiesService.create(createPropertyDto, user);
  }

  @Post('/update-property-permission')
  @CheckPermission(caslSubjects.Property, Actions.Update)
  updatePropertyPermission(
    @Body() updatePropertyPermissionDto: UpdatePropertyPermissionDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertiesService.updatePropertyPermission(
      updatePropertyPermissionDto,
      user,
    );
  }

  @Get()
  @CheckPermission(caslSubjects.Property, Actions.Read)
  findAll(
    @Query() filter: GetPropertyDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertiesService.findAll(filter, user);
  }

  @Post('selected')
  @CheckPermission(caslSubjects.Property, Actions.Read)
  findSelectedProperties(
    @Body() filter: GetSelectedPropertiesDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertiesService.findSelectedProperties(filter, user);
  }

  @Post('export')
  @CheckPermission(caslSubjects.Property, Actions.Read)
  export(@Body() body: ExportPropertyDto, @GetRequestUser() user: RequestUser) {
    return this.propertiesService.export(body, user);
  }

  @Get('user-permission')
  getUserPermissionForProperty(
    @Query() input: CheckUserPermissionDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertiesService.getUserPermissionForProperty(input, user);
  }

  @Get('user-properties')
  @CheckPermission(caslSubjects.Property, Actions.Read)
  getUserProperties(
    @Query() input: GetUserPropertiesDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertiesService.getUserProperties(input, user);
  }

  @Get(':id')
  @CheckPermission(caslSubjects.Property, Actions.Read)
  findOne(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.propertiesService.findOne(id, user);
  }

  @Patch(':id')
  @CheckPermission(caslSubjects.Property, Actions.Update)
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, user);
  }

  @Patch('update-property-status/:id')
  @CheckPermission(caslSubjects.Property, Actions.Update)
  updatePropertyStatus(
    @Param('id') id: string,
    @Body() updatePropertyStatusDto: UpdatePropertyStatusDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertiesService.updatePropertyStatus(
      id,
      updatePropertyStatusDto,
      user,
    );
  }
}
