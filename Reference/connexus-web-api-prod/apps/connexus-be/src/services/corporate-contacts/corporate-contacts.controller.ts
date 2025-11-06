import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CorporateContactsService } from './corporate-contacts.service';
import { CreateCorporateContactDto } from './dto/create-corporate-contact.dto';
import { GetCorporateContactDto } from './dto/get-corporate-contact.dto';
import { UpdateCorporateContactDto } from './dto/update-corporate-contact.dto';

@RouteController('corporate-contacts')
export class CorporateContactsController {
  constructor(
    private readonly corporateContactsService: CorporateContactsService,
  ) {}

  @Post()
  create(
    @Body() createCorporateContactDto: CreateCorporateContactDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.corporateContactsService.create(
      createCorporateContactDto,
      user,
    );
  }

  @Get()
  findAll(
    @GetRequestUser() user: RequestUser,
    @Query() query: GetCorporateContactDto,
  ) {
    return this.corporateContactsService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.corporateContactsService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCorporateContactDto: UpdateCorporateContactDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.corporateContactsService.update(
      id,
      updateCorporateContactDto,
      user,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.corporateContactsService.remove(id, user);
  }
}
