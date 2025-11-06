import { ExportRequestTypes } from '@app/export-data';
import { Injectable } from '@nestjs/common';
import { ClientSowExportHandler } from '../handlers/client-sow-export.handler';
import { PropertyExportHandler } from '../handlers/property-export.handler';
import { SowExportHandler } from '../handlers/sow-export.handler';
import { IExportHandler } from './export-factory.interface';

@Injectable()
export class ExportFactoryService {
  constructor(
    private readonly sowExportHandler: SowExportHandler,
    private readonly propertyExportHandler: PropertyExportHandler,
    private readonly clientSowExportHandler: ClientSowExportHandler,
  ) {}

  /**
   * Get the appropriate export handler based on export type
   */
  getHandler(exportType: ExportRequestTypes): IExportHandler {
    switch (exportType) {
      case ExportRequestTypes.SOW_LIBRARY:
        return this.sowExportHandler;
      case ExportRequestTypes.PROPERTIES:
        return this.propertyExportHandler;
      case ExportRequestTypes.CLIENT_SOW:
        return this.clientSowExportHandler;
      case ExportRequestTypes.RFP:
        // TODO: Implement RfpExportHandler
        throw new Error(`Export type ${exportType} not yet implemented`);
      default:
        throw new Error(`Unsupported export type: ${exportType}`);
    }
  }

  /**
   * Get all available export handlers
   */
  getAllHandlers(): IExportHandler[] {
    return [
      this.sowExportHandler,
      this.propertyExportHandler,
      this.clientSowExportHandler,
    ];
  }

  /**
   * Check if export type is supported
   */
  isSupported(exportType: ExportRequestTypes): boolean {
    try {
      this.getHandler(exportType);
      return true;
    } catch {
      return false;
    }
  }
}
