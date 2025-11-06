import { envValues } from '@app/core';
import { PrismaService } from '@app/prisma';
import { S3Service } from '@app/shared';
import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { ScopeOfWorkVersionService } from '../scope-of-work-version/scope-of-work-version.service';
import { OnlyOfficeConversionResponse } from '../scope-of-work/dto/only-office-conversion-response';
import { SaveOnlyOfficeDocDto } from './dto/create-only-office.dto';
import { OnlyOfficeEditPayload, SaveOnlyOfficeResult } from './dto/types';

@Injectable()
export class OnlyOfficeService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly s3Service: S3Service,
    private readonly scopeOfWorkVersionService: ScopeOfWorkVersionService,
  ) {}

  private readonly logger = new Logger(OnlyOfficeService.name);

  private readonly jwtSecret = envValues.onlyOffice.jwtSecret;

  /**
   * Save the OnlyOffice document, handling new version creation for property versions if needed.
   * @param saveOnlyOfficeDocDto - DTO containing OnlyOffice save payload
   * @returns SaveOnlyOfficeResult
   */
  async saveDocument(
    saveOnlyOfficeDocDto: SaveOnlyOfficeDocDto,
  ): Promise<SaveOnlyOfficeResult> {
    if (
      saveOnlyOfficeDocDto.status !== 2 &&
      saveOnlyOfficeDocDto.status !== 6
    ) {
      this.logger.log(
        `Status is ${saveOnlyOfficeDocDto.status} - no file update`,
      );
      return { error: 0 };
    }

    const fileUrl = saveOnlyOfficeDocDto.url;
    this.logger.log(`File URL: ${fileUrl}`);

    if (!fileUrl) {
      return { error: 1, message: 'Missing fileUrl' };
    }

    if (!saveOnlyOfficeDocDto.key) {
      return { error: 1, message: 'Missing key' };
    }

    const scopeOfWorkVersionId = saveOnlyOfficeDocDto.key.substring(
      0,
      saveOnlyOfficeDocDto.key.lastIndexOf('-'),
    );

    const userId = saveOnlyOfficeDocDto.history?.changes?.[0]?.user.id;

    const originalSowVersion =
      await this.prismaService.client.scopeOfWorkVersion.findUniqueOrThrow({
        where: { id: scopeOfWorkVersionId },
        include: { scopeOfWorkPropertyVersion: true },
      });

    try {
      const { buffer, contentType } = await this.downloadFileAsBuffer(fileUrl);

      if (userId && userId !== originalSowVersion.createdById) {
        const existingDraft =
          await this.prismaService.client.scopeOfWorkVersion.findFirst({
            where: {
              parentVersionId: scopeOfWorkVersionId,
              createdById: userId,
              isCurrent: true,
              scopeOfWorkPropertyVersion: originalSowVersion
                .scopeOfWorkPropertyVersion?.length
                ? {
                    some: {
                      scopeOfWorkPropertyId:
                        originalSowVersion.scopeOfWorkPropertyVersion[0]
                          .scopeOfWorkPropertyId,
                    },
                  }
                : undefined,
            },
            include: { scopeOfWorkPropertyVersion: true },
          });

        if (existingDraft) {
          // Draft exists, update it
          return await this.scopeOfWorkVersionService.handleOnlyOfficeVersioning(
            {
              scopeOfWorkId: existingDraft.scopeOfWorkId,
              scopeOfWorkPropertyId: existingDraft.scopeOfWorkPropertyVersion
                ?.length
                ? existingDraft.scopeOfWorkPropertyVersion[0]
                    .scopeOfWorkPropertyId
                : undefined,
              fileName: existingDraft.fileName,
              buffer,
              contentType,
              userId,
              scopeOfWorkVersionId: existingDraft.id,
              shouldCreateNewVersion: false,
            },
          );
        }
        // No draft, create a new version from the original
        return await this.scopeOfWorkVersionService.handleOnlyOfficeVersioning({
          scopeOfWorkId: originalSowVersion.scopeOfWorkId,
          scopeOfWorkPropertyId: originalSowVersion.scopeOfWorkPropertyVersion
            ?.length
            ? originalSowVersion.scopeOfWorkPropertyVersion[0]
                .scopeOfWorkPropertyId
            : undefined,
          fileName: originalSowVersion.fileName,
          buffer,
          contentType,
          userId,
          scopeOfWorkVersionId,
          shouldCreateNewVersion: true,
        });
      }

      // If same user, update the original version
      return await this.scopeOfWorkVersionService.handleOnlyOfficeVersioning({
        scopeOfWorkId: originalSowVersion.scopeOfWorkId,
        scopeOfWorkPropertyId: originalSowVersion.scopeOfWorkPropertyVersion
          ?.length
          ? originalSowVersion.scopeOfWorkPropertyVersion[0]
              .scopeOfWorkPropertyId
          : undefined,
        fileName: originalSowVersion.fileName,
        buffer,
        contentType,
        userId,
        scopeOfWorkVersionId,
        shouldCreateNewVersion: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(
        `Error saving OnlyOffice file for filename=${saveOnlyOfficeDocDto.filename}, key=${saveOnlyOfficeDocDto.key}: ${errorMessage}`,
        err instanceof Error ? err.stack : undefined,
      );
      return { error: 1, message: errorMessage };
    }
  }

  private downloadFileAsBuffer(
    url: string,
  ): Promise<{ buffer: Buffer; contentType?: string }> {
    return new Promise((resolve, reject) => {
      https
        .get(url, (response) => {
          const buffers: Buffer[] = [];
          response.on('data', (chunk) => buffers.push(chunk));
          response.on('end', () => {
            const buffer = Buffer.concat(buffers);
            resolve({ buffer, contentType: response.headers['content-type'] });
          });
          response.on('error', (err) => reject(err));
        })
        .on('error', (err) => reject(err));
    });
  }

  async getEditPayload(data: {
    filePath: string;
    userId: string;
    userName: string;
    key: string;
    filename: string;
  }): Promise<OnlyOfficeEditPayload> {
    const { filePath, key, filename, userId, userName } = data;
    this.logger.log(`Generating edit config for file: ${data.filePath}`);

    const ext = path.extname(filename).substring(1);
    this.logger.log(`File extension: ${ext}`);

    const { url: fileUrl } = await this.s3Service.generateDownloadSignedUrl({
      key: filePath,
      expiresInSeconds: 3600,
    });

    // const callbackUrl =
    //   'https://60df-117-243-217-45.ngrok-free.app/v1/only-office/save';
    const { callbackUrl } = envValues.onlyOffice;

    this.logger.log(`Generated S3 presigned URL`);

    const user = {
      id: userId,
      name: userName,
    };
    const documentKey = `${key}-${Date.now()}`;

    const payload = {
      document: {
        title: filename,
        url: fileUrl,
        fileType: ext,
        key: documentKey,
      },
      editorConfig: {
        callbackUrl,
        mode: 'edit',
        user,
      },
      permissions: {
        edit: true,
        download: true,
        review: false,
        chat: false,
      },
    };

    const token = jwt.sign(payload, this.jwtSecret);
    this.logger.log('OnlyOffice JWT token signed');

    return {
      documentType: 'word',
      type: 'desktop',
      width: '100%',
      height: '100%',
      token,
      document: {
        fileType: ext,
        key: documentKey,
        title: filename,
        url: fileUrl,
      },
      editorConfig: {
        callbackUrl,
        mode: 'edit',
        user,
        customization: {
          forcesave: true,
          autosave: false,
          toolbarNoTabs: true,
        },
      },
      permissions: payload.permissions,
    };
  }

  async convertToPdf(input: {
    filePath: string;
    key: string;
    filename: string;
  }) {
    const { filePath, key, filename } = input;

    const { url: fileUrl } = await this.s3Service.generateDownloadSignedUrl({
      key: filePath,
      expiresInSeconds: 3600,
    });
    const secret = this.jwtSecret;
    const payload = {
      async: false,
      filetype: 'docx',
      key: `${key}-${Date.now()}`,
      outputtype: 'pdf',
      title: filename,
      url: fileUrl,
    };
    const token = jwt.sign(payload, secret, {
      expiresIn: '30m',
    });

    const requestBody = {
      ...payload,
      token,
    };

    const convertUrl = `https://docs.joinconnexus.com/ConvertService.ashx`;

    const response = await fetch(convertUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error('Failed to convert document to PDF');
    }

    const data = (await response.json()) as OnlyOfficeConversionResponse;

    return data;
  }
}
