import { RequestUser, RouteController } from '@app/shared';
import { GetRequestUser } from '@app/shared/decorators/get-user.decorator';
import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateRfpDto } from './dto/create-rfp.dto';
import { GetPotentialVendorsDto } from './dto/get-potential-vendors.dto';
import { GetRfpPropertiesDto } from './dto/get-rfp-properties.dto';
import { GetRfpScopeOfWorkDto } from './dto/get-rfp-scope-of-work.dto';
import { GetRfpTemplateDto } from './dto/get-rfp-template.dto';
import { GetRfpDto } from './dto/get-rfp.dto';
import { UpdateRfpDto } from './dto/update-rfp.dto';
import { RfpService } from './rfp.service';

@RouteController('rfp')
export class RfpController {
  constructor(private readonly rfpService: RfpService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new RFP' })
  @ApiResponse({
    status: 201,
    description: 'The RFP has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(
    @Body() createRfpDto: CreateRfpDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.rfpService.create(createRfpDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all RFPs' })
  @ApiResponse({ status: 200, description: 'Return all RFPs.' })
  findAll(@Query() query: GetRfpDto) {
    return this.rfpService.findAll(query);
  }

  @Get('properties')
  @ApiOperation({
    summary:
      'Get paginted properties associated with a specific RFP with filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of properties for the RFP with filters.',
  })
  async getRfpProperties(@Query() query: GetRfpPropertiesDto) {
    return this.rfpService.getRfpProperties(query);
  }

  @Get(':id/properties')
  @ApiOperation({
    summary: 'Get all properties associated with a specific RFP with filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of properties for the RFP with filters.',
  })
  async getAllRfpProperties(@Param('id') rfpId: string) {
    return this.rfpService.getAllRfpProperties(rfpId);
  }

  @Get(':id/scope-of-work')
  async getRfpScopeOfWork(
    @Param('id') rfpId: string,
    @Query() query: GetRfpScopeOfWorkDto,
  ) {
    return this.rfpService.getRfpScopeOfWork({ ...query, rfpId });
  }

  @Post('rfp-template/generate')
  @ApiOperation({ summary: 'Generate RFP template' })
  async generateRfpTemplate(
    @Body() input: GetRfpTemplateDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.rfpService.generateRfpTemplate(input, user);
  }

  @Get(':rfpId/properties/:propertyId/potential-vendors')
  @ApiOperation({
    summary: 'Get potential vendors for a specific RFP and property',
    description:
      'Returns a paginated list of vendors that can potentially service the specified property for the given RFP, based on their service capabilities and geographic coverage.',
  })
  @ApiParam({
    name: 'rfpId',
    description: 'RFP ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'propertyId',
    description: 'Property ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiNotFoundResponse({
    description: 'RFP not found or Property not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'RFP not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid parameters or property not in RFP',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            {
              type: 'string',
              example: 'Property is not associated with this RFP',
            },
            { type: 'string', example: 'Invalid RFP ID' },
            {
              type: 'array',
              items: { type: 'string' },
              example: ['status must be a valid enum value'],
            },
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - Database or processing error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example:
            'An unexpected error occurred while retrieving potential vendors',
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async getPotentialVendors(
    @Param('rfpId') rfpId: string,
    @Param('propertyId') propertyId: string,
    @Query() query: GetPotentialVendorsDto,
  ) {
    return this.rfpService.getPotentialVendors(rfpId, propertyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an RFP by ID' })
  @ApiOkResponse({ description: 'Return the RFP.' })
  @ApiNotFoundResponse({ description: 'RFP not found.' })
  findOne(@Param('id') id: string) {
    return this.rfpService.findOne(id);
  }

  @Get(':id/documents/duplicate-check')
  @ApiOperation({ summary: 'Check duplicate RFP document by hash' })
  @ApiQuery({ name: 'fileHash', required: true, type: String })
  checkDuplicateRfpDocument(
    @Param('id') rfpId: string,
    @Query('fileHash') fileHash: string,
  ) {
    return this.rfpService.checkDuplicateRfpDocumentByHash({ rfpId, fileHash });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRfpDto: UpdateRfpDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.rfpService.update(id, updateRfpDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an RFP by ID' })
  @ApiOkResponse({ description: 'The RFP has been successfully deleted.' })
  @ApiNotFoundResponse({ description: 'RFP not found.' })
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.rfpService.remove(id, user);
  }
}
