import { Actions, caslSubjects } from '@app/ability';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Body, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { CreatePropertyServiceDto } from './dto/create-property-service.dto';
import { GetPropertyServicesDto } from './dto/get-property-services.dto';
import { PropertyServicesService } from './property-services.service';

@RouteController('property-services')
export class PropertyServicesController {
  constructor(
    private readonly propertyServicesService: PropertyServicesService,
  ) {}

  @Post()
  @CheckPermission(caslSubjects.Property, Actions.Update)
  create(
    @Body() createPropertyServiceDto: CreatePropertyServiceDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertyServicesService.create(createPropertyServiceDto, user);
  }

  @Get()
  @CheckPermission(caslSubjects.Property, Actions.Read)
  findAll(
    @Query() input: GetPropertyServicesDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertyServicesService.findAll(input, user);
  }

  @Get(':id')
  @CheckPermission(caslSubjects.Property, Actions.Read)
  findOne(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.propertyServicesService.findOne(id, user);
  }

  @Delete(':id')
  @CheckPermission(caslSubjects.Property, Actions.Update)
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.propertyServicesService.remove(id, user);
  }
}
