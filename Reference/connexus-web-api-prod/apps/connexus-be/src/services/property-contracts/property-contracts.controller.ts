import { Actions, caslSubjects } from '@app/ability';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { ValidatedBody } from 'src/decorator/validation/validated-body.decorator';
import { ValidatedQuery } from 'src/decorator/validation/validated-query.decorator';
import { CreatePropertyContractDto } from './dto/create-property-contract.dto';
import { GetPropertyContractsDto } from './dto/get-property-contracts.dto';
import { UpdatePropertyContractDto } from './dto/update-property-contract.dto';
import { PropertyContractsService } from './property-contracts.service';

@RouteController('property-contracts', {
  security: 'protected',
})
export class PropertyContractsController {
  constructor(
    private readonly propertyContractsService: PropertyContractsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property contract' })
  @CheckPermission(caslSubjects.Contract, Actions.Create)
  create(
    @ValidatedBody() createDto: CreatePropertyContractDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertyContractsService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all property contracts' })
  @CheckPermission(caslSubjects.Contract, Actions.Read)
  findAll(@ValidatedQuery() input: GetPropertyContractsDto) {
    return this.propertyContractsService.findAll(input);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a property contract by id' })
  @CheckPermission(caslSubjects.Contract, Actions.Read)
  findOne(@Param('id') id: string) {
    return this.propertyContractsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a property contract' })
  @CheckPermission(caslSubjects.Contract, Actions.Update)
  update(
    @Param('id') id: string,
    @ValidatedBody() updateDto: UpdatePropertyContractDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.propertyContractsService.update(id, updateDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a property contract' })
  @CheckPermission(caslSubjects.Contract, Actions.Delete)
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.propertyContractsService.remove(id, user);
  }
}
