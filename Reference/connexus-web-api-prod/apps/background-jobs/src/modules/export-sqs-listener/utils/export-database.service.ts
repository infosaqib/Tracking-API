import { PrismaService } from '@app/prisma';
import { Injectable, Logger } from '@nestjs/common';
import { ExportBackgroundJobStatus } from '@prisma/client';

@Injectable()
export class ExportDatabaseService {
  private readonly logger = new Logger(ExportDatabaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update export job status to PROCESSING
   */
  async markAsProcessing(exportId: string): Promise<void> {
    try {
      await this.prisma.client.exportBackgroundJobs.update({
        where: { id: exportId },
        data: {
          status: ExportBackgroundJobStatus.PENDING,
        },
      });
      this.logger.log(`Export job ${exportId} marked as PROCESSING`);
    } catch (error) {
      this.logger.error(
        `Failed to mark export job ${exportId} as PROCESSING:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update export job status to COMPLETED with file details
   */
  async markAsCompleted(exportId: string, fileUrl: string): Promise<void> {
    try {
      await this.prisma.client.exportBackgroundJobs.update({
        where: { id: exportId },
        data: {
          status: ExportBackgroundJobStatus.COMPLETED,
          filePath: fileUrl,
        },
      });
      this.logger.log(
        `Export job ${exportId} marked as COMPLETED with file: ${fileUrl}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to mark export job ${exportId} as COMPLETED:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update export job status to FAILED with error message
   */
  async markAsFailed(exportId: string, errorMessage: string): Promise<void> {
    try {
      await this.prisma.client.exportBackgroundJobs.update({
        where: { id: exportId },
        data: {
          status: ExportBackgroundJobStatus.FAILED,
        },
      });
      this.logger.log(
        `Export job ${exportId} marked as FAILED: ${errorMessage}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to mark export job ${exportId} as FAILED:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get export job details
   */
  async getExportJob(exportId: string) {
    try {
      const exportJob =
        await this.prisma.client.exportBackgroundJobs.findUnique({
          where: { id: exportId },
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        });

      if (!exportJob) {
        throw new Error(`Export job with ID ${exportId} not found`);
      }

      return exportJob;
    } catch (error) {
      this.logger.error(`Failed to get export job ${exportId}:`, error);
      throw error;
    }
  }
}
