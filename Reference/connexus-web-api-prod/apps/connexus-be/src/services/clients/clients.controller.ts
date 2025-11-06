import { Actions, caslSubjects } from '@app/ability';
import { AuthGuard } from '@app/guards';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import {
  Body,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { GetClientsDto } from './dto/get-clients.dto';
import { GetParentCompaniesDto } from './dto/get-parent-companies.';
import { UpdateClientDto } from './dto/update-client.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateThemeHeaderImageDto } from './dto/update-theme-header-image.dto';

@RouteController('clients', {
  security: 'protected',
})
@UseGuards(AuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @CheckPermission(caslSubjects.Client, Actions.Create)
  @CheckPermission(caslSubjects.CorporateContact, Actions.Create)
  create(
    @Body() createClientDto: CreateClientDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.clientsService.create(createClientDto, user);
  }

  @Get()
  @CheckPermission(caslSubjects.Client, Actions.Read)
  findAll(@Query() filter: GetClientsDto, @GetRequestUser() user: RequestUser) {
    return this.clientsService.findAll(filter, user);
  }

  @Get('/parent-companies')
  @CheckPermission(caslSubjects.Client, Actions.Read)
  getParentCompanies(
    @Query() filter: GetParentCompaniesDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.clientsService.getParentCompanies(filter, user);
  }

  @Get('/work-spaces')
  // @CheckPermission(caslSubjects.Client, Actions.Read)
  getWorkSpaces(@GetRequestUser() user: RequestUser) {
    return this.clientsService.getWorkSpaces(user);
  }

  @Get(':id')
  @CheckPermission(caslSubjects.Client, Actions.Read)
  findOne(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.clientsService.findOne(id, user);
  }

  @Patch('update-status/:id')
  @CheckPermission(caslSubjects.Client, Actions.Update)
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.clientsService.updateStatus(id, updateStatusDto, user);
  }

  @Patch('update-theme-header-image/:id')
  @CheckPermission(caslSubjects.Client, Actions.Update)
  updateThemeHeaderImage(
    @Param('id') id: string,
    @Body() updateThemeHeaderImageDto: UpdateThemeHeaderImageDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.clientsService.updateThemeHeaderImage(
      id,
      updateThemeHeaderImageDto,
      user,
    );
  }

  @Patch(':id')
  @CheckPermission(caslSubjects.Client, Actions.Update)
  update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.clientsService.update(id, updateClientDto, user);
  }
}
