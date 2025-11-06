import { ExportRequestTypes } from '@app/export-data';
import { ExportFileTypes } from '@prisma/client';

export interface ExportResult {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  s3Url?: string;
  s3Key?: string;
}

export interface ExportJobData<T = Record<string, any>> {
  fileType: ExportFileTypes;
  type: ExportRequestTypes;
  exportId: string;
  userId: string;
  filters?: T;
  sort?: object;
}

export interface IExportHandler {
  /**
   * Process the export request and return file data
   */
  process(jobData: ExportJobData): Promise<ExportResult>;

  /**
   * Validate the export request
   */
  validate(jobData: ExportJobData): boolean;

  /**
   * Get the export type this handler supports
   */
  getSupportedType(): ExportRequestTypes;
}
