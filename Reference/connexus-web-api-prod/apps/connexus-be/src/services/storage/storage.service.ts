import { envValues } from '@app/core';
import { AccessLevel, getStorageKey, S3Service, UploadType } from '@app/shared';
import {
  GenerateSignedUrlInput,
  GetFileInput,
  UploadFileInput,
} from '@app/shared/s3/s3-types';
import { Injectable } from '@nestjs/common';
import { CreateDownloadUrlDto } from './dto/create-download-url.dto';
import { CreateSignedUrlDto } from './dto/create-signed-url.dto';

@Injectable()
export class StorageService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadFile(
    key: string,
    body: Buffer,
    contentType?: string,
  ): Promise<string> {
    const input: UploadFileInput = { key, body, contentType };
    const result = await this.s3Service.uploadFile(input);
    return result.url;
  }

  async getFile(key: string): Promise<Buffer> {
    const input: GetFileInput = { key };
    const result = await this.s3Service.getFile(input);
    return result.body;
  }

  // S3Service does not have deleteFile, so this is removed.

  async generateSignedUrl(input: CreateSignedUrlDto) {
    const { expiresIn, uploadType, fileType, resourceId, fileName } = input;
    let accessLevel: AccessLevel;
    switch (uploadType) {
      case UploadType.CLIENT_LOGO:
      case UploadType.VENDOR_LOGO:
      case UploadType.CLIENT_HEADER_IMAGE:
        accessLevel = AccessLevel.PUBLIC;
        break;
      case UploadType.VENDOR_W9:
      case UploadType.VENDOR_CERTIFICATE_OF_INSURANCE:
      case UploadType.AI_CONTRACT_DOCUMENT:
      case UploadType.AI_CONTRACTS_ZIP:
      case UploadType.SCOPE_OF_WORK:
      case UploadType.RFP_PROPERTY_ATTACHMENT:
      case UploadType.RFP_ATTACHMENT:
      case UploadType.SOW_TEMPLATE:
      case UploadType.RFP_TEMPLATE:
        accessLevel = AccessLevel.PRIVATE;
        break;
      default:
        throw new Error('Invalid upload type');
    }
    const key = getStorageKey({
      accessLevel,
      fileType,
      resourceId,
      uploadType,
      fileName,
    });
    const s3Input: GenerateSignedUrlInput = {
      key,
      expiresInSeconds: expiresIn,
      contentType: fileType,
    };
    const result = await this.s3Service.generateUploadSignedUrl(s3Input);
    return {
      exists: false,
      url: result.url,
      filePath: key,
      cdnUrl: `${envValues.storage.cdnUrl}/${key}`,
    };
  }

  async generateDownloadUrl(input: CreateDownloadUrlDto) {
    const { key } = input;
    const s3Input: GenerateSignedUrlInput = {
      key,
      expiresInSeconds: 1800, // 30 minutes
    };
    const result = await this.s3Service.generateDownloadSignedUrl(s3Input);
    return {
      url: result.url,
      filePath: key,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Service.deleteFile(key);
  }
}
