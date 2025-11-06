import { Actions, caslSubjects } from '@app/ability';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { ValidatedBody } from 'src/decorator/validation/validated-body.decorator';
import { ValidatedQuery } from 'src/decorator/validation/validated-query.decorator';
import { BulkUpdatePropertyContractServiceDto } from './dto/bulk-update-property-contract-service.dto';
import { CreatePropertyContractServiceDto } from './dto/create-property-contract-service.dto';
import { GetPropertyContractServicesDto } from './dto/get-property-contract-services.dto';
import { UpdatePropertyContractServiceDto } from './dto/update-property-contract-service.dto';
import { PropertyContractServicesService } from './property-contract-services.service';

@RouteController('property-contract-services', {
  security: 'protected',
})
export class PropertyContractServicesController {
  constructor(
    private readonly propertyContractServicesService: PropertyContractServicesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property contract service' })
  @CheckPermission(caslSubjects.Contract, Actions.Create)
  create(
    @ValidatedBody() createDto: CreatePropertyContractServiceDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertyContractServicesService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all property contract services' })
  @CheckPermission(caslSubjects.Contract, Actions.Read)
  findAll(@ValidatedQuery() input: GetPropertyContractServicesDto) {
    return this.propertyContractServicesService.findAll(input);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a property contract service by id' })
  @CheckPermission(caslSubjects.Contract, Actions.Read)
  findOne(@Param('id') id: string) {
    return this.propertyContractServicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a property contract service' })
  @CheckPermission(caslSubjects.Contract, Actions.Update)
  update(
    @Param('id') id: string,
    @ValidatedBody() updateDto: UpdatePropertyContractServiceDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertyContractServicesService.update(id, updateDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a property contract service' })
  @CheckPermission(caslSubjects.Contract, Actions.Delete)
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.propertyContractServicesService.remove(id, user);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update property contract services' })
  @CheckPermission(caslSubjects.Contract, Actions.Update)
  bulkUpdate(
    @ValidatedBody() input: BulkUpdatePropertyContractServiceDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertyContractServicesService.bulkUpdate(input, user);
  }
}
