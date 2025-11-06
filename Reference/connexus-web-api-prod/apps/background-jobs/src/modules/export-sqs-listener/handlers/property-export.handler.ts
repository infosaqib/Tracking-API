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
import { PropertyExportData, PropertyExportFilters } from '../types';
import {
  ExportData,
  FileGeneratorService,
} from '../utils/file-generator.service';

@Injectable()
export class PropertyExportHandler implements IExportHandler {
  private readonly logger = new Logger(PropertyExportHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileGenerator: FileGeneratorService,
  ) {}

  getSupportedType(): ExportRequestTypes {
    return ExportRequestTypes.PROPERTIES;
  }

  validate(jobData: ExportJobData): boolean {
    return jobData.type === ExportRequestTypes.PROPERTIES;
  }

  async process(jobData: ExportJobData): Promise<ExportResult> {
    this.logger.log(`Processing Properties export for job ${jobData.exportId}`);

    try {
      // Get Properties data
      const propertyData = await this.getPropertyData(
        jobData.filters || {},
        jobData.sort,
      );

      // Transform data for export
      const exportData = this.transformDataForExport(
        propertyData,
        jobData.filters || {},
      );

      // Generate file based on requested format
      let fileName = `properties-export-${format(
        new Date(),
        'yyyy-MM-dd-HH-mm-ss',
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
        `Failed to process Properties export for job ${jobData.exportId}:`,
        error,
      );
      throw error;
    }
  }

  private async getPropertyData(
    filters: PropertyExportFilters,
    sort?: object,
  ): Promise<PropertyExportData[]> {
    // Use the filters directly as they're already a properly constructed Prisma where clause
    const where = filters as Prisma.ClientPropertiesWhereInput;

    this.logger.log(
      `Fetching Property data with filters: ${JSON.stringify(where)}`,
    );

    // Use dynamic sorting if provided, otherwise default to createdAt desc
    const orderBy = sort || { createdAt: 'desc' };

    const propertyData = await this.prisma.client.clientProperties.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        status: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        state: {
          select: {
            id: true,
            stateName: true,
          },
        },
        city: {
          select: {
            id: true,
            cityName: true,
          },
        },
        county: {
          select: {
            id: true,
            name: true,
          },
        },
        propertyManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy,
    });

    this.logger.log(
      `Retrieved ${propertyData.length} Property records for export`,
    );
    return propertyData;
  }

  private transformDataForExport(
    propertyData: PropertyExportData[],
    filters: PropertyExportFilters,
  ): ExportData {
    const headers = [
      'Property Name',
      'Client Name',
      'Full Address',
      'City',
      'County',
      'State',
      'Property Manager',
      'PM Email',
      'Status',
    ];

    const rows = propertyData.map((property) => [
      property.name || 'N/A',
      property.client?.name || 'N/A',
      property.address || 'N/A',
      property.city?.cityName || 'N/A',
      property.county?.name || 'N/A',
      property.state?.stateName || 'N/A',
      property.propertyManager
        ? `${property.propertyManager.firstName} ${property.propertyManager.lastName}`
        : 'N/A',
      property.propertyManager?.email || 'N/A',
      this.transformEnumToSentenceCase(property.status),
    ]);

    // Generate dynamic title based on filters
    const title = this.generateExportTitle(filters);

    return {
      headers,
      rows,
      title,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generateExportTitle(_filters: PropertyExportFilters): string {
    // // Check for clientId (either direct string or { in: [...] } object)
    // if (
    //   filters.clientId &&
    //   (typeof filters.clientId === 'string' ||
    //     (typeof filters.clientId === 'object' && 'in' in filters.clientId))
    // ) {
    //   return 'Client Properties Export';
    // }
    // if (filters.isRetail === true) {
    //   return 'Retail Properties Export';
    // }
    // if (filters.status && typeof filters.status === 'string') {
    //   return `${this.transformEnumToSentenceCase(filters.status)} Properties Export`;
    // }
    return 'Property List Export';
  }

  private transformEnumToSentenceCase(enumValue: string): string {
    if (!enumValue) return 'N/A';

    return enumValue
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
