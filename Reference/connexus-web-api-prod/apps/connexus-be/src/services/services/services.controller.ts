import { Actions, caslSubjects } from '@app/ability';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { BulkUpdateServicesDto } from './dto/bulk-update-services.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { GetAllSubServicesDto } from './dto/get-all-sub-services.dto';
import { GetServicesDto } from './dto/get-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@RouteController('services', {})
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @CheckPermission(caslSubjects.Service, Actions.Create)
  create(@Body() input: CreateServiceDto, @GetRequestUser() user: RequestUser) {
    return this.servicesService.create(input, user);
  }

  @Get()
  @CheckPermission(caslSubjects.Service, Actions.Read)
  findAll(@Query() input: GetServicesDto) {
    return this.servicesService.findAll(input);
  }

  @Get('all')
  getAllServicesAndSubServices(@Query() input: GetAllSubServicesDto) {
    return this.servicesService.getServicesAndSubServices(input);
  }

  @Get(':id')
  @CheckPermission(caslSubjects.Service, Actions.Read)
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Put('bulk')
  @ApiOperation({ summary: 'Bulk update services' })
  @ApiResponse({
    status: 200,
    description: 'Services updated successfully',
  })
  @CheckPermission(caslSubjects.Service, Actions.Update)
  bulkUpdate(
    @Body() input: BulkUpdateServicesDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.servicesService.bulkUpdate(input, user);
  }

  @Patch(':id')
  @CheckPermission(caslSubjects.Service, Actions.Update)
  update(
    @Param('id') id: string,
    @Body() input: UpdateServiceDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.servicesService.update(id, input, user);
  }

  @Delete(':id')
  @CheckPermission(caslSubjects.Service, Actions.Delete)
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.servicesService.remove(id, user);
  }
}
