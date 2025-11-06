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
import { SowExportData, SowExportFilters } from '../types';
import {
  ExportData,
  FileGeneratorService,
} from '../utils/file-generator.service';

@Injectable()
export class SowExportHandler implements IExportHandler {
  private readonly logger = new Logger(SowExportHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileGenerator: FileGeneratorService,
  ) {}

  getSupportedType(): ExportRequestTypes {
    return ExportRequestTypes.SOW_LIBRARY;
  }

  validate(jobData: ExportJobData): boolean {
    return jobData.type === ExportRequestTypes.SOW_LIBRARY;
  }

  async process(jobData: ExportJobData): Promise<ExportResult> {
    this.logger.log(`Processing SOW export for job ${jobData.exportId}`);

    const { filters } = jobData as ExportJobData<Prisma.ScopeOfWorkWhereInput>;

    let fileName = `sow-export-${format(new Date(), 'yyyy_MM_dd_HH_mm')}`;
    const { scopeType } = filters;

    if (scopeType === 'BASE_SCOPE_LIBRARY') {
      fileName = `Connexus_Scope_Library_Export_${format(new Date(), 'yyyy_MM_dd_HH_mm')}`;
    }

    if (scopeType === 'CLIENT_SCOPE_LIBRARY') {
      fileName = `Client_Scope_Library_Export_${format(new Date(), 'yyyy_MM_dd_HH_mm')}`;
    }

    try {
      // Get SOW data using the same logic as scope-of-work.service.ts
      const sowData = await this.getSowData(
        jobData.filters || {},
        jobData.sort,
      );

      // Transform data for export
      const exportData = this.transformDataForExport(
        sowData,
        jobData.filters || {},
      );

      // Generate file based on requested format
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
        `Failed to process SOW export for job ${jobData.exportId}:`,
        error,
      );
      throw error;
    }
  }

  private async getSowData(
    filters: SowExportFilters,
    sort?: object,
  ): Promise<SowExportData[]> {
    // Use the filters directly as they're already a properly constructed Prisma where clause
    const where = filters as Prisma.ScopeOfWorkWhereInput;

    this.logger.log(`Fetching SOW data with filters: ${JSON.stringify(where)}`);

    const sowData = await this.prisma.client.scopeOfWork.findMany({
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
        scopeOfWorkVersion: {
          where: { isCurrent: true },
          select: {
            id: true,
            versionNumber: true,
            fileName: true,
            sourceFileUrl: true,
            content: true,
            createdAt: true,
            createdBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: sort || { createdAt: 'desc' },
    });

    this.logger.log(`Retrieved ${sowData.length} SOW records for export`);
    return sowData;
  }

  private transformDataForExport(
    sowData: SowExportData[],
    filters: SowExportFilters,
  ): ExportData {
    // Check if this is base scope library (no client column needed)
    const scopeType =
      typeof filters.scopeType === 'string' ? filters.scopeType : undefined;
    const isBaseScopeLibrary = scopeType === 'BASE_SCOPE_LIBRARY';
    const isClientScopeLibrary = scopeType === 'CLIENT_SCOPE_LIBRARY';

    // Only handle BASE_SCOPE_LIBRARY and CLIENT_SCOPE_LIBRARY
    if (!isBaseScopeLibrary && !isClientScopeLibrary) {
      throw new Error(
        `Unsupported scope type: ${scopeType}. Only BASE_SCOPE_LIBRARY and CLIENT_SCOPE_LIBRARY are supported.`,
      );
    }

    // Build headers based on scope type
    let headers: string[];
    if (isBaseScopeLibrary) {
      headers = [
        'Services',
        'Scope Of Work Name',
        'Uploaded By',
        'Uploaded Date',
        'Updated By',
        'Updated Date',
        'Status',
      ];
    } else {
      // CLIENT_SCOPE_LIBRARY
      headers = [
        'Client Name',
        'Scope Of Work Name',
        'Services',
        'Uploaded By',
        'Uploaded Date',
        'Updated By',
        'Updated Date',
        'Status',
      ];
    }

    const rows = sowData.map((sow) => {
      let row: (string | undefined)[];

      if (isBaseScopeLibrary) {
        row = [
          sow.service?.servicesName || 'N/A',
          sow.scopeName || 'N/A',
          sow.createdBy?.fullName || 'N/A',
          sow.createdAt
            ? format(new Date(sow.createdAt), 'MMM dd, yyyy')
            : 'N/A',
          sow.modifiedBy?.fullName || 'N/A',
          sow.updatedAt
            ? format(new Date(sow.updatedAt), 'MMM dd, yyyy')
            : 'N/A',
          this.transformEnumToSentenceCase(sow.scopeOfWorkStatus),
        ];
      } else {
        // CLIENT_SCOPE_LIBRARY
        row = [
          sow.client?.name || 'N/A',
          sow.scopeName || 'N/A',
          sow.service?.servicesName || 'N/A',
          sow.createdBy?.fullName || 'N/A',
          sow.createdAt
            ? format(new Date(sow.createdAt), 'MMM dd, yyyy')
            : 'N/A',
          sow.modifiedBy?.fullName || 'N/A',
          sow.updatedAt
            ? format(new Date(sow.updatedAt), 'MMM dd, yyyy')
            : 'N/A',
          this.transformEnumToSentenceCase(sow.scopeOfWorkStatus),
        ];
      }

      return row;
    });

    // Generate dynamic title based on scopeType from the where clause
    const title = this.generateExportTitle(scopeType);

    return {
      headers,
      rows,
      title,
    };
  }

  private generateExportTitle(scopeType?: string): string {
    if (!scopeType) {
      return 'Scope of Work';
    }

    switch (scopeType) {
      case 'BASE_SCOPE_LIBRARY':
        return 'Connexus Scope Library';
      case 'CLIENT_SCOPE_LIBRARY':
        return 'Client Scope Library';
      case 'CLIENT_SCOPE_OF_WORK':
        return 'Client Scope of Work';
      default:
        return 'Scope of Work';
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
