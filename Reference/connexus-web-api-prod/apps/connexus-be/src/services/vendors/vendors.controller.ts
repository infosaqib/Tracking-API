import { Actions, caslSubjects } from '@app/ability';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Body, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { ValidatedBody } from 'src/decorator/validation/validated-body.decorator';
import { ValidatedQuery } from 'src/decorator/validation/validated-query.decorator';
import { CreateVendorDraftDto } from './dto/create-vendor-draft.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { GetSelectedVendorsDto } from './dto/get-selected-vendors.dto';
import { GetVendorsDto } from './dto/get-vendors.dto';
import { UpdateVendorServiceAreaDto } from './dto/update-vendor-service-area';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsService } from './vendors.service';

@RouteController('vendors', {})
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @CheckPermission(caslSubjects.Vendor, Actions.Create)
  create(
    @ValidatedBody() input: CreateVendorDto,
    @GetRequestUser() user: RequestUser,
  ) {
    // Check if the user has permission to create a vendor of this type
    this.vendorsService.checkVendorCreationPermission(input.type, user);
    return this.vendorsService.create(input, user);
  }

  @Get()
  @CheckPermission(caslSubjects.Vendor, Actions.Read)
  findAll(
    @ValidatedQuery() input: GetVendorsDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.vendorsService.findAll(input, user);
  }

  @Post('selected')
  // @CheckPermission(caslSubjects.Vendor, Actions.Read)
  @ApiOperation({ summary: 'Get selected vendors with filtering and sorting' })
  @ApiResponse({
    status: 200,
    description: 'Selected vendors retrieved successfully',
  })
  findSelectedVendors(@ValidatedBody() input: GetSelectedVendorsDto) {
    return this.vendorsService.findSelectedVendors(input);
  }

  @Get('basic')
  // @CheckPermission(caslSubjects.Vendor, Actions.Read)
  @ApiOperation({ summary: 'Get basic vendor information' })
  @ApiResponse({
    status: 200,
    description: 'Basic vendor information retrieved successfully',
  })
  findAllBasic(@ValidatedQuery() input: GetVendorsDto) {
    return this.vendorsService.findAllBasic(input);
  }

  @Get('service-area/:id')
  @CheckPermission(caslSubjects.Vendor, Actions.Read)
  getServiceableAreas(
    @Param('id') id: string,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.vendorsService.getServiceableAreas(id, user);
  }

  @Get('workspaces')
  getVendorWorkSpaces(@GetRequestUser() user: RequestUser) {
    return this.vendorsService.getVendorWorkSpaces(user);
  }

  @Get(':id')
  @CheckPermission(caslSubjects.Vendor, Actions.Read)
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Patch('service-area/:id')
  @CheckPermission(caslSubjects.Vendor, Actions.Update)
  updateVendorServiceArea(
    @Param('id') id: string,
    @Body() input: UpdateVendorServiceAreaDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.vendorsService.updateVendorServiceArea(id, input, user);
  }

  @Patch(':id')
  @CheckPermission(caslSubjects.Vendor, Actions.Update)
  update(
    @Param('id') id: string,
    @ValidatedBody() input: UpdateVendorDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.vendorsService.update(id, input, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update vendor status' })
  @ApiResponse({
    status: 200,
    description: 'Vendor status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @ValidatedBody() updateStatusDto: UpdateVendorStatusDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.vendorsService.updateStatus(id, updateStatusDto, user);
  }

  @Delete(':id')
  @CheckPermission(caslSubjects.Vendor, Actions.Delete)
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.vendorsService.remove(id, user);
  }

  @Post('draft')
  @ApiOperation({
    summary: 'Create a vendor draft with just the name and client Id',
  })
  @ApiResponse({
    status: 201,
    description: 'The vendor draft has been successfully created.',
  })
  createDraft(
    @Body() createVendorDraftDto: CreateVendorDraftDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.vendorsService.createDraft(createVendorDraftDto, user);
  }
}
