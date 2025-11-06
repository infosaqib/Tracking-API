import { Actions, caslSubjects } from '@app/ability';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { ValidatedBody } from 'src/decorator/validation/validated-body.decorator';
import { ValidatedQuery } from 'src/decorator/validation/validated-query.decorator';
import { CreateVendorBranchContactDto } from './dto/create-vendor-branch-contact.dto';
import { CreateVendorContactDto } from './dto/create-vendor-contact.dto';
import { GetVendorContactDto } from './dto/get-vendor-contact.dto';
import { UpdateContactTypeDto } from './dto/update-contact-type.dto';
import { UpdateVendorBranchContactDto } from './dto/update-vendor-branch-contact.dto';
import { UpdateVendorContactDto } from './dto/update-vendor-contact.dto';
import { VendorContactsService } from './vendor-contacts.service';

@RouteController('vendor-contacts', {
  security: 'protected',
})
export class VendorContactsController {
  constructor(private readonly vendorContactsService: VendorContactsService) {}

  @Post()
  @CheckPermission(caslSubjects.VendorContact, Actions.Create)
  create(
    @ValidatedBody() createVendorContactDto: CreateVendorContactDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.vendorContactsService.create(createVendorContactDto, user);
  }

  @Post('branch')
  @CheckPermission(caslSubjects.VendorContact, Actions.Create)
  createBranchContact(
    @ValidatedBody() createVendorBranchContactDto: CreateVendorBranchContactDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.vendorContactsService.createVendorBranchContact(
      createVendorBranchContactDto,
      user,
    );
  }

  @Get()
  @CheckPermission(caslSubjects.VendorContact, Actions.Read)
  findAll(
    @ValidatedQuery() getVendorContactDto: GetVendorContactDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.vendorContactsService.findAll(getVendorContactDto, user);
  }

  @Delete(':id')
  @CheckPermission(caslSubjects.VendorContact, Actions.Delete)
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.vendorContactsService.remove(id, user);
  }

  @Patch(':id')
  @CheckPermission(caslSubjects.VendorContact, Actions.Update)
  updateOne(
    @Param('id') id: string,
    @ValidatedBody() updateVendorContactDto: UpdateVendorContactDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.vendorContactsService.updateOne(
      id,
      updateVendorContactDto,
      user,
    );
  }

  @Patch('branch/:id')
  @CheckPermission(caslSubjects.VendorContact, Actions.Update)
  updateBranchContact(
    @Param('id') id: string,
    @ValidatedBody() updateVendorBranchContactDto: UpdateVendorBranchContactDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.vendorContactsService.updateBranchContact(
      id,
      updateVendorBranchContactDto,
      user,
    );
  }

  @Patch(':id/contact-type')
  @CheckPermission(caslSubjects.VendorContact, Actions.Update)
  updateContactType(
    @Param('id') id: string,
    @ValidatedBody() updateContactTypeDto: UpdateContactTypeDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.vendorContactsService.updateContactType(
      id,
      updateContactTypeDto,
      user,
    );
  }
}
