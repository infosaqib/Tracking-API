import { Actions, caslSubjects } from '@app/ability';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { CreatePropertyContactDto } from './dto/create-property-contact.dto';
import { GetPropertyContactDto } from './dto/get-property-conatct.dto';
import { UpdatePropertyContactDto } from './dto/update-property-contact.dto';
import { PropertyContactsService } from './property-contacts.service';

@RouteController('property-contacts', {
  security: 'protected',
})
export class PropertyContactsController {
  constructor(
    private readonly propertyContactsService: PropertyContactsService,
  ) {}

  @Post()
  @CheckPermission(caslSubjects.PropertyContact, Actions.Create)
  create(
    @Body() createPropertyContactDto: CreatePropertyContactDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertyContactsService.create(createPropertyContactDto, user);
  }

  @Get()
  @CheckPermission(caslSubjects.PropertyContact, Actions.Read)
  findAll(
    @Query() input: GetPropertyContactDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertyContactsService.findAll(input, user);
  }

  @Delete(':id')
  @CheckPermission(caslSubjects.PropertyContact, Actions.Delete)
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.propertyContactsService.remove(id, user);
  }

  @Patch(':id')
  @CheckPermission(caslSubjects.PropertyContact, Actions.Update)
  updateOne(
    @Param('id') id: string,
    @Body() updatePropertyContactDto: UpdatePropertyContactDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertyContactsService.updateOne(
      id,
      updatePropertyContactDto,
      user,
    );
  }
}
