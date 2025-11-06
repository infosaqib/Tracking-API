import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CreateScopeOfWorkDto } from './dto/create-scope-of-work.dto';
import { ExportSowDto } from './dto/export-sow.dto';
import { GetScopeOfWorkDetailsDto } from './dto/get-scope-of-work-details.dto';
import { GetScopeOfWorkDto } from './dto/get-scope-of-work.dto';
import { GetVersionHistoryDto } from './dto/get-version-history.dto';
import { UpdateScopeOfWorkDto } from './dto/update-scope-of-work.dto';
import { ScopeOfWorkService } from './scope-of-work.service';

@RouteController('scope-of-work')
export class ScopeOfWorkController {
  constructor(private readonly scopeOfWorkService: ScopeOfWorkService) {}

  @Post('library')
  create(
    @Body() createScopeOfWorkDto: CreateScopeOfWorkDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.scopeOfWorkService.create(createScopeOfWorkDto, user);
  }

  @Post('library/export')
  export(@Body() body: ExportSowDto, @GetRequestUser() user: RequestUser) {
    return this.scopeOfWorkService.export(body, user);
  }

  @Get('library')
  findAll(@Query() query: GetScopeOfWorkDto) {
    return this.scopeOfWorkService.findAll(query);
  }

  @Get('library/version-history')
  @ApiOperation({
    summary: 'Get version history',
    description:
      'Retrieve version history for scope of work documents with filtering options',
  })
  getVersionHistory(@Query() query: GetVersionHistoryDto) {
    return this.scopeOfWorkService.getVersionHistory(query);
  }

  /**
   * Download the PDF file for a Scope of Work Version by versionId.
   * @param versionId The Scope of Work Version ID.
   * @param res The response object.
   */
  @Get('library/version/:versionId/download-pdf')
  async downloadScopeOfWorkVersionPdf(@Param('versionId') versionId: string) {
    const result =
      await this.scopeOfWorkService.downloadScopeOfWorkVersionPdf(versionId);

    return result;
  }

  @Get('library/version-history/:id/edit-payload')
  @ApiOperation({
    summary: 'Get edit payload',
    description: 'Get edit payload for a version document',
  })
  editVersionDocumentPayload(
    @Param('id') id: string,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.scopeOfWorkService.editVersionDocumentPayload(id, user);
  }

  @Get('library/:id')
  findOne(@Param('id') id: string) {
    return this.scopeOfWorkService.findOne(id);
  }

  @Patch('library/:id')
  update(
    @Param('id') id: string,
    @Body() updateScopeOfWorkDto: UpdateScopeOfWorkDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.scopeOfWorkService.update(id, updateScopeOfWorkDto, user);
  }

  @Delete('library/:id')
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.scopeOfWorkService.remove(id, user);
  }

  @Get(':scopeOfWorkId/details')
  @ApiOperation({
    summary:
      'Get scope of work details with current version and optional property filter',
    description:
      'Get scope of work details by ID, including current version and optionally filter joined properties by propertyIds.',
  })
  getScopeOfWorkDetails(
    @Param('scopeOfWorkId') scopeOfWorkId: string,
    @Query() query: GetScopeOfWorkDetailsDto,
  ) {
    return this.scopeOfWorkService.getScopeOfWorkDetails(scopeOfWorkId, query);
  }
}
