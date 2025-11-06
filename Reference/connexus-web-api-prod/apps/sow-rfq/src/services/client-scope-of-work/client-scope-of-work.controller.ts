import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ClientScopeOfWorkService } from './client-scope-of-work.service';
import { CopyVersionsToProperties } from './dto/copy-versions-to-properties';
import { CreateClientScopeOfWorkFromMarkdownDto } from './dto/create-client-scope-of-work-from-markdown.dto';
import { CreateClientScopeOfWorkDto } from './dto/create-client-scope-of-work.dto';
import { ExportClientSowDto } from './dto/export-client-sow.dto';
import { GetAllPropertiesDto } from './dto/get-all-properties.dto';
import { GetClientScopeOfWorkDto } from './dto/get-client-scope-of-work.dto';
import { GetPropertyForRfpDto } from './dto/get-property-for-rfp';
import { GetScopeOfWorkPropertyVersionDto } from './dto/get-scope-of-work-property-version.dto';
import { GetScopeOfWorkPropertyDto } from './dto/get-scope-of-work-property.dto';
import { GetSowTemplateDto } from './dto/get-sow-template.dto';
import { UpdateClientScopeOfWorkDto } from './dto/update-client-scope-of-work.dto';

@RouteController('client-scope-of-work')
export class ClientScopeOfWorkController {
  constructor(
    private readonly clientScopeOfWorkService: ClientScopeOfWorkService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client scope of work' })
  async create(
    @Body() createClientScopeOfWorkDto: CreateClientScopeOfWorkDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.clientScopeOfWorkService.create(
      createClientScopeOfWorkDto,
      user,
    );
  }

  @Post('copy-version-to-property')
  @ApiOperation({ summary: 'Copy a version to a property' })
  async copyVersionToProperty(
    @Body() createClientScopeOfWorkDto: CopyVersionsToProperties,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.clientScopeOfWorkService.copyVersionToProperty(
      createClientScopeOfWorkDto,
      user,
    );
  }

  @Post('generate-from-markdown')
  @ApiOperation({
    summary: 'Create a new client scope of work from markdown content',
  })
  async createFromMarkdown(
    @Body()
    createClientScopeOfWorkFromMarkdownDto: CreateClientScopeOfWorkFromMarkdownDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.clientScopeOfWorkService.createFromMarkdown(
      createClientScopeOfWorkFromMarkdownDto,
      user,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all client scope of work with pagination' })
  async findAll(@Query() query: GetClientScopeOfWorkDto) {
    return this.clientScopeOfWorkService.findAll(query);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export client scope of work data' })
  @ApiResponse({
    status: 201,
    description: 'Export job created successfully',
  })
  async export(
    @Body() exportDto: ExportClientSowDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.clientScopeOfWorkService.export(exportDto, user);
  }

  @Get('version/:scopeOfWorkPropertyVersionId/edit-payload')
  @ApiOperation({
    summary: 'Get edit payload for a specific property version',
  })
  async getEditPayload(
    @Param('scopeOfWorkPropertyVersionId') scopeOfWorkPropertyVersionId: string,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.clientScopeOfWorkService.editVersionDocumentPayload(
      scopeOfWorkPropertyVersionId,
      user,
    );
  }

  @Post('sow-template/generate')
  @ApiOperation({ summary: 'Generate Client Scope of Work template' })
  async getSowTemplate(
    @Body() input: GetSowTemplateDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.clientScopeOfWorkService.generateSowTemplate(input, user);
  }

  @Get('property')
  @ApiOperation({ summary: 'List properties in scope of work with filters' })
  async getScopeOfWorkProperties(@Query() query: GetScopeOfWorkPropertyDto) {
    return this.clientScopeOfWorkService.getScopeOfWorkProperties(query);
  }

  @Get('property-version')
  @ApiOperation({ summary: 'List ScopeOfWorkPropertyVersion records' })
  async findAllPropertyVersions(
    @Query() query: GetScopeOfWorkPropertyVersionDto,
  ) {
    return this.clientScopeOfWorkService.findAllPropertyVersions(query);
  }

  @Get('property-for-rfp')
  @ApiOperation({
    summary: 'Get properties for RFP with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Properties retrieved successfully for RFP',
  })
  async getPropertyForRfp(@Query() query: GetPropertyForRfpDto) {
    return this.clientScopeOfWorkService.getPropertyForRfp(query);
  }

  @Get('property/:scopeOfWorkPropertyId/current-version')
  @ApiOperation({
    summary:
      'Get current version of a scope of work property with signed file URL',
  })
  async getCurrentVersionWithSignedUrl(
    @Param('scopeOfWorkPropertyId') scopeOfWorkPropertyId: string,
  ) {
    return this.clientScopeOfWorkService.getCurrentVersionWithSignedUrl(
      scopeOfWorkPropertyId,
    );
  }

  @Get('property-version/:scopeOfWorkPropertyVersionId')
  @ApiOperation({ summary: 'Get a ScopeOfWorkPropertyVersion by ID' })
  async findOnePropertyVersion(
    @Param('scopeOfWorkPropertyVersionId') scopeOfWorkPropertyVersionId: string,
  ) {
    return this.clientScopeOfWorkService.findOnePropertyVersion(
      scopeOfWorkPropertyVersionId,
    );
  }

  @Delete('property/:id')
  @ApiOperation({ summary: 'Delete a ScopeOfWorkProperty by ID' })
  @ApiParam({ name: 'id', description: 'ScopeOfWorkProperty ID' })
  @ApiResponse({
    status: 200,
    description: 'ScopeOfWorkProperty deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'ScopeOfWorkProperty not found' })
  async removeProperty(@Param('id') id: string) {
    return this.clientScopeOfWorkService.removeProperty(id);
  }

  @Get('properties/:clientId')
  getAllPropertiesInAClient(
    @Param('clientId') clientId: string,
    @Query() query: GetAllPropertiesDto,
  ) {
    return this.clientScopeOfWorkService.getAllPropertiesInAClient(
      clientId,
      query,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client scope of work by ID' })
  @ApiParam({ name: 'id', description: 'Client scope of work ID' })
  @ApiResponse({ status: 404, description: 'Client scope of work not found' })
  async findOne(@Param('id') id: string) {
    return this.clientScopeOfWorkService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client scope of work' })
  @ApiResponse({
    status: 200,
    description: 'Client scope of work updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Client scope of work not found' })
  async update(
    @Param('id') id: string,
    @Body() updateClientScopeOfWorkDto: UpdateClientScopeOfWorkDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.clientScopeOfWorkService.update(
      id,
      updateClientScopeOfWorkDto,
      user,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client scope of work' })
  @ApiParam({ name: 'id', description: 'Client scope of work ID' })
  @ApiResponse({
    status: 200,
    description: 'Client scope of work deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Client scope of work not found' })
  async remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.clientScopeOfWorkService.remove(id, user);
  }
}
