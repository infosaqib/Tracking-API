import { Actions, caslSubjects } from '@app/ability';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { ValidatedBody } from 'src/decorator/validation/validated-body.decorator';
import { setExportResponseHeaders } from 'src/utils/file-export-utils';
import { GetServicesDto } from '../services/dto/get-service.dto';
import { GetVendorsDto } from '../vendors/dto/get-vendors.dto';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ExportContractPropertyWiseDto } from './dto/exporty-property-wise.dto';
import { GetContractPropertyWiseDto } from './dto/get-contract-property-wise.dto';
import { GetContractDto } from './dto/get-contract.dto';
import { GetPropertyDtoContract } from './dto/get-property-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UpdatePendingConnexusDto } from './dto/update-pending-connexus.dto';

@RouteController('contracts', {
  security: 'protected',
})
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @CheckPermission(caslSubjects.Contract, Actions.Create)
  create(
    @ValidatedBody() createContractDto: CreateContractDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.contractsService.create(createContractDto, user);
  }

  @Get()
  @CheckPermission(caslSubjects.Contract, Actions.Read)
  findAll(@Query() input: GetContractDto, @GetRequestUser() user: RequestUser) {
    return this.contractsService.findAll(input, user);
  }

  @Get('/vendorList')
  @CheckPermission(caslSubjects.Contract, Actions.Read)
  async findVendors(
    @Query() input: GetVendorsDto,
    @GetRequestUser() user: RequestUser,
  ) {
    try {
      return await this.contractsService.findVendors(input, user);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve vendor list',
        error,
      };
    }
  }

  @Get('/propertyList')
  @CheckPermission(caslSubjects.Contract, Actions.Read)
  async findProperties(
    @Query() input: GetPropertyDtoContract,
    @GetRequestUser() user: RequestUser,
  ) {
    try {
      return await this.contractsService.findProperties(input, user);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve property list',
        error,
      };
    }
  }

  @Get('/servicesList')
  @CheckPermission(caslSubjects.Contract, Actions.Read)
  async findServices(@Query() input: GetServicesDto) {
    try {
      return await this.contractsService.findServices(input);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve service list',
        error,
      };
    }
  }

  @Get('/property-wise')
  @CheckPermission(caslSubjects.Contract, Actions.Read)
  findAllPropertyWise(
    @Query() input: GetContractPropertyWiseDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.contractsService.findAllPropertyWise(input, user);
  }

  @Get('/property-wise/export')
  @CheckPermission(caslSubjects.Contract, Actions.Read)
  async exportPropertyWise(
    @Query() input: ExportContractPropertyWiseDto,
    @GetRequestUser() user: RequestUser,
    @Res() response: any,
  ) {
    const data = await this.contractsService.exportAllPropertyWise({
      input,
      user,
    });

    setExportResponseHeaders(response, input.format);
    response.send(data);
  }

  @Get('/property-wise/:id')
  @CheckPermission(caslSubjects.Contract, Actions.Read)
  findPropertyWiseById(@Param('id') id: string) {
    return this.contractsService.findOnePropertyWise(id);
  }

  @Get(':id')
  @CheckPermission(caslSubjects.Contract, Actions.Read)
  findOne(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.contractsService.findOne(id, user);
  }

  @Patch(':id')
  @CheckPermission(caslSubjects.Contract, Actions.Update)
  update(
    @Param('id') id: string,
    @ValidatedBody() updateContractDto: UpdateContractDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.contractsService.update(id, updateContractDto, user);
  }

  @Patch(':id/update-pending-connexus')
  @CheckPermission(caslSubjects.Contract, Actions.Update)
  updatePendingConnexus(
    @Param('id') id: string,
    @ValidatedBody() updatePendingConnexusDto: UpdatePendingConnexusDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.contractsService.updatePendingConnexus(
      id,
      updatePendingConnexusDto,
      user,
    );
  }

  @Delete(':id')
  @CheckPermission(caslSubjects.Contract, Actions.Delete)
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.contractsService.remove(id, user);
  }
}
