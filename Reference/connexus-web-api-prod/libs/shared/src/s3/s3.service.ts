import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CopyFileInput,
  CopyFileOutput,
  GenerateSignedUrlInput,
  GenerateSignedUrlOutput,
  GetFileInput,
  GetFileOutput,
  UploadFileInput,
  UploadFileOutput,
} from './s3-types';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3Client: S3Client;

  private bucket: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('s3.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('s3.accessKeyId'),
        secretAccessKey: this.configService.get<string>('s3.secretAccessKey'),
      },
    });
    this.bucket = this.configService.get<string>('s3.bucket');
  }

  /**
   * Upload a file to S3.
   * @param input UploadFileInput
   * @returns UploadFileOutput
   */
  async uploadFile(input: UploadFileInput): Promise<UploadFileOutput> {
    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    };
    await this.s3Client.send(new PutObjectCommand(params));
    return {
      url: `https://${this.bucket}.s3.${this.configService.get<string>('s3.region')}.amazonaws.com/${input.key}`,
    };
  }

  /**
   * Get a file from S3.
   * @param input GetFileInput
   * @returns GetFileOutput
   */
  async getFile(input: GetFileInput): Promise<GetFileOutput> {
    const params: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: input.key,
    };
    const command = new GetObjectCommand(params);
    const response = await this.s3Client.send(command);
    const body = await this.streamToBuffer(
      response.Body as NodeJS.ReadableStream,
    );
    return {
      body,
      contentType: response.ContentType,
    };
  }

  /**
   * Generate a signed URL for uploading a file to S3.
   * @param input GenerateSignedUrlInput
   * @returns GenerateSignedUrlOutput
   */
  async generateUploadSignedUrl(
    input: GenerateSignedUrlInput,
  ): Promise<GenerateSignedUrlOutput> {
    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: input.key,
      ContentType: input.contentType,
    };
    const command = new PutObjectCommand(params);
    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: input.expiresInSeconds ?? 900,
    });
    return { url };
  }

  /**
   * Generate a signed URL for downloading a file from S3.
   * @param input GenerateSignedUrlInput
   * @returns GenerateSignedUrlOutput
   */
  async generateDownloadSignedUrl(
    input: GenerateSignedUrlInput,
  ): Promise<GenerateSignedUrlOutput> {
    const params: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: input.key,
    };
    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: input.expiresInSeconds ?? 900,
    });
    return { url };
  }

  /**
   * Convert a readable stream to a buffer.
   * @param stream NodeJS.ReadableStream
   * @returns Buffer
   */
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Delete a file from S3.
   * @param key string
   * @returns Promise<void>
   */
  async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: this.bucket,
      Key: key,
    };
    const command = new DeleteObjectCommand(params);
    await this.s3Client.send(command);
  }

  /**
   * Copy a file to multiple locations in S3.
   * @param input CopyFileInput
   * @returns CopyFileOutput
   */
  async copyFileToMultipleLocations(
    input: CopyFileInput,
  ): Promise<CopyFileOutput> {
    const region = this.configService.get<string>('s3.region');
    const copyPromises = input.destinationKeys.map((destinationKey) => {
      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${input.sourceKey}`,
        Key: destinationKey,
      });
      return this.s3Client
        .send(command)
        .then(
          () =>
            `https://${this.bucket}.s3.${region}.amazonaws.com/${destinationKey}`,
        );
    });
    const urls = await Promise.all(copyPromises);
    return {
      destinationKeys: input.destinationKeys,
      urls,
    };
  }
}
