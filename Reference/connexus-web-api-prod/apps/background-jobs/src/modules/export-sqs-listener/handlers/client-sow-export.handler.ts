import { ExportRequestTypes } from '@app/export-data';
import { PrismaService } from '@app/prisma';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { format } from 'date-fns';
import {
  ExportJobData,
  ExportResult,
  IExportHandler,
} from '../factories/export-factory.interface';
import { ClientSowExportData, ClientSowExportFilters } from '../types';
import {
  ExportData,
  FileGeneratorService,
} from '../utils/file-generator.service';

@Injectable()
export class ClientSowExportHandler implements IExportHandler {
  private readonly logger = new Logger(ClientSowExportHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileGenerator: FileGeneratorService,
  ) {}

  getSupportedType(): ExportRequestTypes {
    return ExportRequestTypes.CLIENT_SOW;
  }

  validate(jobData: ExportJobData): boolean {
    return jobData.type === ExportRequestTypes.CLIENT_SOW;
  }

  async process(jobData: ExportJobData): Promise<ExportResult> {
    this.logger.log(`Processing Client SOW export for job ${jobData.exportId}`);

    try {
      // Get Client SOW data using the same logic as client-scope-of-work.service.ts
      const clientSowData = await this.getClientSowData(
        jobData.filters || {},
        jobData.sort,
      );

      // Transform data for export
      const exportData = this.transformDataForExport(
        clientSowData,
        jobData.filters || {},
      );

      // Generate file based on requested format
      let fileName = `Client_Scope_Of_Work_Export_${format(
        new Date(),
        'yyyy_MM_dd_HH_mm',
      )}`;
      const { buffer, mimeType, extension, s3Key } =
        await this.fileGenerator.generateFile(
          jobData.fileType,
          exportData,
          jobData.exportId,
          fileName,
        );

      fileName = `${fileName}.${extension}`;

      return {
        fileBuffer: buffer,
        fileName,
        mimeType,
        s3Key,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process Client SOW export for job ${jobData.exportId}:`,
        error,
      );
      throw error;
    }
  }

  private async getClientSowData(
    filters: ClientSowExportFilters,
    sort?: object,
  ): Promise<ClientSowExportData[]> {
    // Use the filters directly as they're already a properly constructed Prisma where clause
    const where = filters as Prisma.ScopeOfWorkWhereInput;

    this.logger.log(
      `Fetching Client SOW data with filters: ${JSON.stringify(where)}`,
    );

    const clientSowData = await this.prisma.client.scopeOfWork.findMany({
      where,
      select: {
        id: true,
        scopeName: true,
        scopeType: true,
        scopeOfWorkStatus: true,
        createdAt: true,
        updatedAt: true,
        service: {
          select: {
            id: true,
            servicesName: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        modifiedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        scopeOfWorkProperty: {
          select: {
            id: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: sort || { createdAt: 'desc' },
    });

    this.logger.log(
      `Retrieved ${clientSowData.length} Client SOW records for export`,
    );
    return clientSowData;
  }

  private transformDataForExport(
    clientSowData: ClientSowExportData[],
    filters: ClientSowExportFilters,
  ): ExportData {
    const headers = [
      'Client Name',
      'Scope Of Work Name',
      'Property Names',
      'Services',
      'Uploaded By',
      'Uploaded Date',
      'Updated By',
      'Updated Date',
      'Status',
    ];

    const rows = clientSowData.map((sow) => {
      // Show all properties by joining the names
      const propertyNames = sow.scopeOfWorkProperty
        .map((sp) => sp.property?.name)
        .filter(Boolean);

      const propertyDisplay = propertyNames.join(', ');

      return [
        sow.client?.name || 'N/A',
        sow.scopeName || 'N/A',
        propertyDisplay || 'N/A',
        sow.service?.servicesName || 'N/A',
        sow.createdBy?.fullName || 'N/A',
        sow.createdAt ? format(new Date(sow.createdAt), 'MMM dd, yyyy') : 'N/A',
        sow.modifiedBy?.fullName || 'N/A',
        sow.updatedAt ? format(new Date(sow.updatedAt), 'MMM dd, yyyy') : 'N/A',
        this.transformEnumToSentenceCase(sow.scopeOfWorkStatus),
      ];
    });

    // Generate dynamic title based on scopeType from the where clause
    const scopeType =
      typeof filters.scopeType === 'string' ? filters.scopeType : undefined;
    const title = this.generateExportTitle(scopeType);

    return {
      headers,
      rows,
      title,
    };
  }

  private generateExportTitle(scopeType?: string): string {
    if (!scopeType) {
      return 'Client Scope of Work Export';
    }

    switch (scopeType) {
      case 'CLIENT_SCOPE_OF_WORK':
        return 'Client Scope of Work Export';
      default:
        return 'Client Scope of Work Export';
    }
  }

  private transformEnumToSentenceCase(enumValue: string): string {
    if (!enumValue) return 'N/A';

    return enumValue
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
