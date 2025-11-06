import { ExportRequestTypes } from '@app/export-data';
import { Message } from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { ExportFileTypes } from '@prisma/client';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import { ExportFactoryService } from './factories/export-factory.service';
import { ExportDatabaseService } from './utils/export-database.service';

interface ExportMessage {
  message: 'TABLE_EXPORT';
  data: {
    fileType: ExportFileTypes;
    type: ExportRequestTypes;
    exportId: string;
    userId: string;
    filters?: Record<string, any>;
  };
}

@Injectable()
export class ExportSqsListenerService {
  private readonly logger = new Logger(ExportSqsListenerService.name);

  constructor(
    private readonly exportFactory: ExportFactoryService,
    private readonly exportDatabase: ExportDatabaseService,
  ) {}

  @SqsMessageHandler('export-queue')
  async handleExportMessage(message: Message): Promise<boolean> {
    // Log message received
    this.logger.log(`=== EXPORT QUEUE MESSAGE RECEIVED ===`);
    this.logger.log(`Message ID: ${message.MessageId}`);
    this.logger.log(`Receipt Handle: ${message.ReceiptHandle}`);
    this.logger.log(`MD5 of Body: ${message.MD5OfBody}`);
    this.logger.log(`Body Size: ${message.Body?.length || 0} characters`);
    this.logger.log(`Attributes: ${JSON.stringify(message.Attributes || {})}`);
    this.logger.log(
      `Message Attributes: ${JSON.stringify(message.MessageAttributes || {})}`,
    );

    try {
      // Log raw message body
      this.logger.log(`Raw Message Body: ${message.Body}`);

      const messageBody: ExportMessage = JSON.parse(message.Body || '{}');

      // Log parsed message details
      this.logger.log(`=== PARSED MESSAGE DETAILS ===`);
      this.logger.log(`Message Type: ${messageBody.message}`);
      this.logger.log(`Export Type: ${messageBody.data?.type}`);
      this.logger.log(`File Type: ${messageBody.data?.fileType}`);
      this.logger.log(`Export ID: ${messageBody.data?.exportId}`);
      this.logger.log(`User ID: ${messageBody.data?.userId}`);
      this.logger.log(
        `Filters: ${JSON.stringify(messageBody.data?.filters, null, 2)}`,
      );
      this.logger.log(
        `Full Message Object: ${JSON.stringify(messageBody, null, 2)}`,
      );

      // Process the export using the factory pattern
      await this.processExport(messageBody);

      this.logger.log(
        `✅ Successfully processed export message: ${message.MessageId}`,
      );
      this.logger.log(`=== END PROCESSING ===`);
      return true; // Acknowledge successful processing
    } catch (error) {
      this.logger.error(
        `❌ Failed to process export message: ${message.MessageId}`,
      );
      this.logger.error(
        `Error details: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.logger.error(
        `Error stack: ${error instanceof Error ? error.stack : 'No stack trace available'}`,
      );
      this.logger.error(`=== END PROCESSING WITH ERROR ===`);
      return false; // Retry failed messages
    }
  }

  /**
   * Process export message using factory pattern
   */
  private async processExport(message: ExportMessage): Promise<void> {
    const { data } = message;
    const { exportId, type } = data;

    try {
      // Mark job as processing
      await this.exportDatabase.markAsProcessing(exportId);

      // Get appropriate handler from factory
      const handler = this.exportFactory.getHandler(type);

      // Validate the job data
      if (!handler.validate(data)) {
        throw new Error(`Invalid job data for export type ${type}`);
      }

      // Process the export
      this.logger.log(
        `Processing export with handler: ${handler.constructor.name}`,
      );
      const result = await handler.process(data);

      // Upload file to S3 and get URL
      const s3Url = result.s3Key || `temp-url-${result.fileName}`; // Fallback for backward compatibility

      // Mark job as completed
      await this.exportDatabase.markAsCompleted(exportId, s3Url);

      this.logger.log(`Export completed successfully: ${result.fileName}`);
    } catch (error) {
      this.logger.error(`Export failed for job ${exportId}:`, error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.exportDatabase.markAsFailed(exportId, errorMessage);

      throw error; // Re-throw to trigger SQS retry mechanism
    }
  }
}
