import { PrismaService } from '@app/prisma';
import { RequestUser } from '@app/shared';
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import 'multer';
import { CheckDuplicateRfpPropertyAttachmentDto } from './dto/check-duplicate-rfp-property-attachment.dto';
import { CreateRfpPropertyAttachmentDto } from './dto/create-rfp-property-attachment.dto';
import { GetRfpPropertyAttachmentsDto } from './dto/get-rfp-property-attachments.dto';
import { UpdateRfpPropertyAttachmentDto } from './dto/update-rfp-property-attachment.dto';

@Injectable()
export class RfpPropertyAttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createRfpPropertyAttachmentDto: CreateRfpPropertyAttachmentDto,
    user: RequestUser,
  ) {
    if (createRfpPropertyAttachmentDto.fileHash) {
      const duplicate =
        await this.prisma.client.rfpPropertyAttachments.findFirst({
          where: {
            rfpId: createRfpPropertyAttachmentDto.rfpId,
            propertyId: createRfpPropertyAttachmentDto.propertyId,
            fileHash: createRfpPropertyAttachmentDto.fileHash,
            deletedAt: null,
          },
          select: { id: true },
        });
      if (duplicate) {
        throw new ConflictException(
          'Duplicate attachment exists for this RFP and property',
        );
      }
    }
    return this.prisma.client.rfpPropertyAttachments.create({
      data: {
        fileName: createRfpPropertyAttachmentDto.fileName,
        propertyId: createRfpPropertyAttachmentDto.propertyId,
        filePath: createRfpPropertyAttachmentDto.filePath,
        fileType: createRfpPropertyAttachmentDto.fileType,
        fileSizeBytes: createRfpPropertyAttachmentDto.fileSizeBytes,
        createdById: user.connexus_user_id,
        updatedById: user.connexus_user_id,
        scopeOfWorkId: createRfpPropertyAttachmentDto.scopeOfWorkId,
        rfpId: createRfpPropertyAttachmentDto.rfpId,
        fileHash: createRfpPropertyAttachmentDto.fileHash,
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSizeBytes: true,
        createdAt: true,
      },
    });
  }

  async findAll(query: GetRfpPropertyAttachmentsDto) {
    const {
      propertyId,
      fileName,
      fileType,
      createdById,
      updatedById,
      createdStartDate,
      createdEndDate,
      uploadedStartDate,
      uploadedEndDate,
      scopeOfWorkId,
      rfpId,
    } = query;

    const where: Prisma.RfpPropertyAttachmentsWhereInput = { deletedAt: null };
    if (propertyId) where.propertyId = propertyId;
    if (fileType) where.fileType = fileType;
    if (createdById) where.createdById = createdById;
    if (updatedById) where.updatedById = updatedById;
    if (fileName) where.fileName = { contains: fileName, mode: 'insensitive' };
    if (createdStartDate || createdEndDate) {
      where.createdAt = {};
      if (createdStartDate) where.createdAt.gte = new Date(createdStartDate);
      if (createdEndDate) where.createdAt.lte = new Date(createdEndDate);
    }
    if (uploadedStartDate || uploadedEndDate) {
      where.uploadedAt = {};
      if (uploadedStartDate) where.uploadedAt.gte = new Date(uploadedStartDate);
      if (uploadedEndDate) where.uploadedAt.lte = new Date(uploadedEndDate);
    }
    if (scopeOfWorkId) where.scopeOfWorkId = scopeOfWorkId;
    if (rfpId) where.rfpId = rfpId;

    return this.prisma.client.rfpPropertyAttachments.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSizeBytes: true,
        filePath: true,
        uploadedAt: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        propertyId: true,
        rfpId: true,
        scopeOfWorkId: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.client.rfpPropertyAttachments.findFirst({
      where: { id, deletedAt: null },
    });
  }

  update(
    id: string,
    updateRfpPropertyAttachmentDto: UpdateRfpPropertyAttachmentDto,
    user: RequestUser,
  ) {
    return this.prisma.client.rfpPropertyAttachments.update({
      where: { id },
      data: {
        fileName: updateRfpPropertyAttachmentDto.fileName,
        filePath: updateRfpPropertyAttachmentDto.filePath,
        fileType: updateRfpPropertyAttachmentDto.fileType,
        fileHash: updateRfpPropertyAttachmentDto.fileHash,
        updatedById: user.connexus_user_id,
        uploadedAt: new Date(),
        modifiedAt: null,
      },
    });
  }

  remove(id: string, user: RequestUser) {
    return this.prisma.client.rfpPropertyAttachments.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: user.connexus_user_id,
      },
    });
  }

  async checkDuplicateByHash(
    dto: CheckDuplicateRfpPropertyAttachmentDto,
  ): Promise<{
    exists: boolean;
    attachment?: {
      id: string;
      fileName: string;
      fileType?: string | null;
      fileSizeBytes?: bigint | null;
    };
  }> {
    const attachment =
      await this.prisma.client.rfpPropertyAttachments.findFirst({
        where: {
          rfpId: dto.rfpId,
          propertyId: dto.propertyId,
          fileHash: dto.fileHash,
          deletedAt: null,
        },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSizeBytes: true,
        },
      });
    if (!attachment) return { exists: false };
    return { exists: true, attachment };
  }
}
