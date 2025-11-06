import { ExportDataService } from '@app/export-data';
import { RouteController } from '@app/shared';
import { Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';

@RouteController('export-data')
export class ExportDataController {
  constructor(private readonly exportDataService: ExportDataService) {}

  @Get(':id')
  @ApiOkResponse({ description: 'The record has been successfully retrieved.' })
  @ApiNotFoundResponse({ description: 'The record was not found.' })
  findOne(@Param('id') id: string) {
    return this.exportDataService.findOne(id);
  }
}
