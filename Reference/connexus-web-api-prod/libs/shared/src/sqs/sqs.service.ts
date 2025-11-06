import { envValues } from '@app/core';
import { SQS, SQSClientConfig } from '@aws-sdk/client-sqs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientScopeOfWorkDocumentUploadInput,
  ExportTableSqsMessageInput,
  GenerateRfpDocTemplateInput,
  GenerateSowDocTemplateInput,
  SowDocumentSqsMessageInput,
  SqsMessageInput,
  ZipSqsMessageInput,
} from './types/contract-upload-input';

@Injectable()
export class SqsService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  private sqsClient: SQS;

  private readonly logger = new Logger(SqsService.name);

  async onModuleInit() {
    const options: SQSClientConfig = {
      region: this.configService.get<string>('sqs.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('sqs.accessKeyId'),
        secretAccessKey: this.configService.get<string>('sqs.secretAccessKey'),
      },
    };
    this.sqsClient = new SQS(options);
  }

  private getQueueUrl(queueID: string) {
    return `${envValues.sqs.baseUrl}/${queueID}`;
  }

  async sendMessage(message: SqsMessageInput) {
    this.logger.debug(
      `Attempting to send SQS message: ${JSON.stringify(message)}`,
    );
    try {
      const result = await this.sqsClient.sendMessage({
        QueueUrl: this.getQueueUrl(envValues.sqs.contractQueueId),
        MessageBody: JSON.stringify(message.input),
      });
      this.logger.debug(
        `Successfully sent SQS message with MessageId: ${result.MessageId}`,
      );
      return result;
    } catch (err) {
      this.logger.error(`Failed to send SQS message: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async sendZipSQSMessage(message: ZipSqsMessageInput) {
    this.logger.debug(
      `Attempting to send SQS message: ${JSON.stringify(message)}`,
    );
    try {
      const result = await this.sqsClient.sendMessage({
        QueueUrl: this.getQueueUrl(envValues.sqs.contractExtractionQueueId),
        MessageBody: JSON.stringify(message.input),
      });
      this.logger.debug(
        `Successfully sent SQS message with MessageId: ${result.MessageId}`,
      );
      return result;
    } catch (err) {
      this.logger.error(`Failed to send SQS message: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async sendSowDocumentSQSMessage(message: SowDocumentSqsMessageInput) {
    this.logger.debug(
      `Attempting to send SQS message: ${JSON.stringify(message)}`,
    );
    try {
      const result = await this.sqsClient.sendMessage({
        QueueUrl: this.getQueueUrl(envValues.sqs.contractSowQueueId),
        MessageBody: JSON.stringify(message.input),
      });
      this.logger.debug(
        `Successfully sent SQS message with MessageId: ${result.MessageId}`,
      );
      return result;
    } catch (err) {
      this.logger.error(`Failed to send SQS message: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async sendClientScopeOfWorkDocumentSQSMessage(
    message: ClientScopeOfWorkDocumentUploadInput,
  ) {
    this.logger.debug(
      `Attempting to send SQS message: ${JSON.stringify(message)}`,
    );
    try {
      const result = await this.sqsClient.sendMessage({
        QueueUrl: this.getQueueUrl(envValues.sqs.contractSowQueueId),
        MessageBody: JSON.stringify(message.input),
      });
      this.logger.debug(
        `Successfully sent SQS message with MessageId: ${result.MessageId}`,
      );
      return result;
    } catch (err) {
      this.logger.error(`Failed to send SQS message: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async generateSowTemplate(message: GenerateSowDocTemplateInput) {
    this.logger.debug(
      `Attempting to generate SOW template: ${JSON.stringify(message)}`,
    );

    try {
      const result = await this.sqsClient.sendMessage({
        QueueUrl: this.getQueueUrl(envValues.sqs.templateGenerationQueueId),
        MessageBody: JSON.stringify(message),
      });
      this.logger.debug(
        `Successfully sent SQS message with MessageId: ${result.MessageId}`,
      );
      return result;
    } catch (err) {
      this.logger.error(
        `Failed to generate SOW template: ${JSON.stringify(err)}`,
      );
      throw err;
    }
  }

  async generateRfpTemplate(message: GenerateRfpDocTemplateInput) {
    this.logger.debug(
      `Attempting to generate RFP template: ${JSON.stringify(message)}`,
    );

    try {
      const result = await this.sqsClient.sendMessage({
        QueueUrl: this.getQueueUrl(envValues.sqs.templateGenerationQueueId),
        MessageBody: JSON.stringify(message),
      });
      this.logger.debug(
        `Successfully sent SQS message with MessageId: ${result.MessageId}`,
      );
      return result;
    } catch (err) {
      this.logger.error(
        `Failed to generate RFP template: ${JSON.stringify(err)}`,
      );
      throw err;
    }
  }

  async sendExportSQSMessage(message: ExportTableSqsMessageInput) {
    this.logger.debug(
      `Attempting to send export SQS message: ${JSON.stringify(message)}`,
    );
    try {
      const result = await this.sqsClient.sendMessage({
        QueueUrl: envValues.backgroundJob.exportQueueUrl,
        MessageBody: JSON.stringify(message),
      });
      this.logger.debug(
        `Successfully sent export SQS message with MessageId: ${result.MessageId}`,
      );
      return result;
    } catch (err) {
      this.logger.error(
        `Failed to send export SQS message: ${JSON.stringify(err)}`,
      );
      throw err;
    }
  }
}
