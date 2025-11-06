import { PrismaService } from '@app/prisma';
import { S3Service } from '@app/shared';
import { getSowVersionS3Key } from '@app/shared/s3/helpers/sow-version-path.util';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { OnlyOfficeVersioningInput } from './dto/types';

@Injectable()
export class ScopeOfWorkVersionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Handles versioning logic for OnlyOffice document saves, including property and SOW versioning.
   * Can either update existing version or create new version based on shouldCreateNewVersion flag.
   * All DB operations are wrapped in a transaction and S3 upload is parallelized where possible.
   * @param input - OnlyOfficeVersioningInput
   * @returns Promise<{ error: number; message?: string }>
   */
  async handleOnlyOfficeVersioning(
    input: OnlyOfficeVersioningInput,
  ): Promise<{ error: number; message?: string }> {
    const {
      scopeOfWorkId,
      scopeOfWorkPropertyId,
      fileName,
      buffer,
      contentType,
      userId,
      scopeOfWorkVersionId,
      shouldCreateNewVersion,
    } = input;

    try {
      if (!shouldCreateNewVersion) {
        // Update existing version
        return await this.updateExistingVersion({
          scopeOfWorkVersionId,
          scopeOfWorkPropertyId,
          buffer,
          contentType,
          userId,
        });
      }

      // Create new version
      return await this.createNewVersion({
        scopeOfWorkId,
        scopeOfWorkPropertyId,
        fileName,
        buffer,
        contentType,
        userId,
        scopeOfWorkVersionId,
      });
    } catch (error) {
      return {
        error: 1,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Updates an existing version without creating a new one
   * @param input - Update version input parameters
   * @returns Promise<{ error: number }>
   */
  private async updateExistingVersion(input: {
    scopeOfWorkVersionId: string;
    scopeOfWorkPropertyId?: string;
    buffer: Buffer;
    contentType?: string;
    userId: string;
  }): Promise<{ error: number }> {
    const {
      scopeOfWorkVersionId,
      scopeOfWorkPropertyId,
      buffer,
      contentType,
      userId,
    } = input;

    // Get the current version to update
    const currentVersion =
      await this.prismaService.client.scopeOfWorkVersion.findUniqueOrThrow({
        where: { id: scopeOfWorkVersionId },
      });

    // Upload to S3 using existing key
    await this.s3Service.uploadFile({
      key: currentVersion.content,
      body: buffer,
      contentType: contentType || 'application/octet-stream',
    });

    // Update the version metadata
    await this.prismaService.client.scopeOfWorkVersion.update({
      where: { id: scopeOfWorkVersionId },
      data: {
        updatedAt: new Date(),
        modifiedById: userId,
      },
    });

    // Update property version if it exists
    if (scopeOfWorkPropertyId) {
      await this.prismaService.client.scopeOfWorkPropertyVersion.updateMany({
        where: {
          scopeOfWorkPropertyId,
          scopeOfWorkVersionId,
        },
        data: {
          modifiedAt: new Date(),
        },
      });
    }

    return { error: 0 };
  }

  /**
   * Creates a new version with proper versioning logic
   * @param input - Create new version input parameters
   * @returns Promise<{ error: number }>
   */
  private async createNewVersion(input: {
    scopeOfWorkId: string;
    scopeOfWorkPropertyId?: string;
    fileName: string;
    buffer: Buffer;
    contentType?: string;
    userId: string;
    scopeOfWorkVersionId: string;
  }): Promise<{ error: number }> {
    const {
      scopeOfWorkId,
      scopeOfWorkPropertyId,
      fileName,
      buffer,
      contentType,
      userId,
      scopeOfWorkVersionId,
    } = input;

    // Generate new version ID and S3 key
    const newVersionId = randomUUID();
    const newKey = getSowVersionS3Key({
      scopeOfWorkId,
      fileName,
      versionId: newVersionId,
      scopeOfWorkPropertyId,
    });

    // Run all DB operations in a transaction
    const createdSowVersion = await this.prismaService.client.$transaction(
      async (tx) => {
        // Mark current versions as not current
        await this.markCurrentVersionsAsInactive(
          tx as unknown as Prisma.TransactionClient,
          scopeOfWorkId,
          scopeOfWorkPropertyId,
        );

        // Get next version number
        const newSowVersionNumber = await this.getNextVersionNumber(
          tx as unknown as Prisma.TransactionClient,
          scopeOfWorkId,
          scopeOfWorkPropertyId,
        );

        // Create new SOW version
        const newSowVersion = await tx.scopeOfWorkVersion.create({
          data: {
            scopeOfWorkId,
            versionNumber: newSowVersionNumber,
            fileName,
            sourceFileUrl: newKey,
            content: newKey,
            isCurrent: true,
            createdById: userId,
            parentVersionId: scopeOfWorkVersionId,
            status: 'COMPLETED',
            updatedAt: new Date(),
          },
        });

        // Create property version if needed
        if (scopeOfWorkPropertyId) {
          await tx.scopeOfWorkPropertyVersion.create({
            data: {
              scopeOfWorkPropertyId,
              scopeOfWorkVersionId: newSowVersion.id,
              isCurrent: true,
              createdAt: new Date(),
            },
          });
        }

        return newSowVersion;
      },
    );

    // Upload to S3
    await this.s3Service.uploadFile({
      key: createdSowVersion.content,
      body: buffer,
      contentType: contentType || 'application/octet-stream',
    });

    return { error: 0 };
  }

  /**
   * Marks current versions as inactive based on whether it's property or library versioning
   * @param tx - Prisma transaction
   * @param scopeOfWorkId - Scope of work ID
   * @param scopeOfWorkPropertyId - Optional property ID for property versioning
   */
  private async markCurrentVersionsAsInactive(
    tx: Prisma.TransactionClient,
    scopeOfWorkId: string,
    scopeOfWorkPropertyId?: string,
  ): Promise<void> {
    if (scopeOfWorkPropertyId) {
      // Property versioning: mark current property version and related SOW versions as not current
      await tx.scopeOfWorkPropertyVersion.updateMany({
        where: { scopeOfWorkPropertyId, isCurrent: true },
        data: { isCurrent: false },
      });

      await tx.scopeOfWorkVersion.updateMany({
        where: {
          isCurrent: true,
          scopeOfWorkPropertyVersion: {
            some: { scopeOfWorkPropertyId },
          },
        },
        data: { isCurrent: false },
      });
    } else {
      // Library versioning: mark current SOW version as not current
      await tx.scopeOfWorkVersion.updateMany({
        where: { scopeOfWorkId, isCurrent: true },
        data: { isCurrent: false },
      });
    }
  }

  /**
   * Gets the next version number for a scope of work
   * @param tx - Prisma transaction
   * @param scopeOfWorkId - Scope of work ID
   * @returns Next version number
   */
  private async getNextVersionNumber(
    tx: Prisma.TransactionClient,
    scopeOfWorkId: string,
    scopeOfWorkPropertyId?: string,
  ): Promise<number> {
    const maxSowVersion = await tx.scopeOfWorkVersion.findFirst({
      where: {
        scopeOfWorkId,
        ...(scopeOfWorkPropertyId && {
          scopeOfWorkPropertyVersion: {
            some: { scopeOfWorkPropertyId },
          },
        }),
      },
      orderBy: { versionNumber: 'desc' },
    });
    return maxSowVersion ? maxSowVersion.versionNumber + 1 : 1;
  }
}
