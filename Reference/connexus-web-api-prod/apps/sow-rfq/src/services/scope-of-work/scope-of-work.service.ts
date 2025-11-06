import { ExportDataService } from '@app/export-data';
import { ExportRequestTypes } from '@app/export-data/dto';
import { PrismaService } from '@app/prisma';
import {
  RequestUser,
  getEndOfDay,
  getPaginationInput,
  getStartofDay,
} from '@app/shared';
import { SqsService } from '@app/shared/sqs';
import { SowDocumentUploadInput } from '@app/shared/sqs/types/contract-upload-input';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ScopeOfWorkStatuses,
  ScopeOfWorkTypes,
  ScopeOfWorkVersion,
  ScopeOfWorkVersionStatuses,
} from '@prisma/client';
import { OnlyOfficeService } from '../only-office/only-office.service';
import { CreateScopeOfWorkDto } from './dto/create-scope-of-work.dto';
import { ExportSowDto } from './dto/export-sow.dto';
import { GetScopeOfWorkDetailsDto } from './dto/get-scope-of-work-details.dto';
import { GetScopeOfWorkDto } from './dto/get-scope-of-work.dto';
import { GetVersionHistoryDto } from './dto/get-version-history.dto';
import { UpdateScopeOfWorkDto } from './dto/update-scope-of-work.dto';
import { checkIsDoc } from './utils/check-is-doc';
import getScopeOfWorkSortInput from './utils/scope-of-work-sort.utils';

@Injectable()
export class ScopeOfWorkService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sqsService: SqsService,
    private readonly onlyOfficeService: OnlyOfficeService,
    private readonly exportDataService: ExportDataService,
  ) {}

  async processDocument(scopeOfWork: SowDocumentUploadInput) {
    await this.sqsService.sendSowDocumentSQSMessage({
      jobType: 'SCOPE_OF_WORK_DOCUMENT_PROCESSING',
      input: scopeOfWork,
    });
  }

  async create(createScopeOfWorkDto: CreateScopeOfWorkDto, user: RequestUser) {
    // Check name is unique
    const existingScope = await this.prismaService.client.scopeOfWork.findFirst(
      {
        where: {
          scopeName: {
            equals: createScopeOfWorkDto.scopeName,
            mode: 'insensitive',
          },
          deletedAt: null,
          scopeType: createScopeOfWorkDto.scopeType,
          clientId: createScopeOfWorkDto.clientId,
        },
      },
    );

    if (existingScope) {
      throw new BadRequestException('Scope of work name must be unique');
    }
    if (createScopeOfWorkDto.clientId) {
      // Check client is valid
      const client = await this.prismaService.client.client.findUnique({
        where: {
          id: createScopeOfWorkDto.clientId,
        },
      });
      if (!client) {
        throw new NotFoundException('Client not found');
      }
    }

    // Check file is docx or doc
    const isDocument = checkIsDoc(createScopeOfWorkDto.fileName);

    const scopeOfWork = await this.prismaService.client.scopeOfWork.create({
      data: {
        scopeName: createScopeOfWorkDto.scopeName,
        scopeType: createScopeOfWorkDto.scopeType,
        createdById: user.connexus_user_id,
        deletedAt: null,
        clientId:
          createScopeOfWorkDto.scopeType === ScopeOfWorkTypes.BASE_SCOPE_LIBRARY
            ? null
            : createScopeOfWorkDto.clientId,
        serviceId: createScopeOfWorkDto.serviceId,
        scopeOfWorkStatus: isDocument
          ? ScopeOfWorkStatuses.ACTIVE
          : ScopeOfWorkStatuses.PROCESSING,
        updatedAt: null,
        scopeOfWorkVersion: {
          create: {
            createdById: user.connexus_user_id,
            isCurrent: true,
            versionNumber: 1,
            sourceFileUrl: createScopeOfWorkDto.fileUrl,
            content: isDocument ? createScopeOfWorkDto.fileUrl : null,
            status: isDocument
              ? ScopeOfWorkVersionStatuses.COMPLETED
              : ScopeOfWorkVersionStatuses.PROCESSING,
            fileName: createScopeOfWorkDto.fileName,
            uploadedById: user.connexus_user_id,
            uploadedAt: new Date(),
            updatedAt: null,
          },
        },
      },
      include: {
        service: true,
        client: true,
        scopeOfWorkVersion: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!isDocument)
      this.processDocument({
        filePath: scopeOfWork.scopeOfWorkVersion[0].sourceFileUrl,
        tenantId: scopeOfWork.clientId ? scopeOfWork.client.tenantId : '',
        scopeId: scopeOfWork.id,
        type: scopeOfWork.scopeType,
        version: scopeOfWork.scopeOfWorkVersion[0].versionNumber,
        versionId: scopeOfWork.scopeOfWorkVersion[0].id,
      });

    return scopeOfWork;
  }

  private buildWhereClause(query: GetScopeOfWorkDto = {}) {
    const {
      search,
      scopeType,
      scopeOfWorkStatus,
      serviceId,
      clientId,
      createdById,
      modifiedById,
      createdStartDate,
      createdEndDate,
      updatedStartDate,
      updatedEndDate,
    } = query;

    const where: Prisma.ScopeOfWorkWhereInput = {
      deletedAt: null,
    };

    // Apply filters
    if (search) {
      where.scopeName = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (scopeType) {
      where.scopeType = scopeType;
    }

    if (scopeOfWorkStatus && scopeOfWorkStatus.length > 0) {
      where.scopeOfWorkStatus = { in: scopeOfWorkStatus };
    }

    if (serviceId && serviceId.length > 0) {
      where.serviceId = { in: serviceId };
    }

    if (clientId && clientId.length > 0) {
      where.clientId = { in: clientId };
    }

    if (createdById && createdById.length > 0) {
      where.createdById = { in: createdById };
    }

    if (modifiedById && modifiedById.length > 0) {
      where.modifiedById = { in: modifiedById };
    }

    if (createdStartDate && createdEndDate) {
      where.createdAt = {
        gte: getStartofDay(createdStartDate),
        lte: getEndOfDay(createdEndDate),
      };
    } else if (createdStartDate) {
      where.createdAt = {
        gte: getStartofDay(createdStartDate),
      };
    } else if (createdEndDate) {
      where.createdAt = {
        lte: getEndOfDay(createdEndDate),
      };
    }

    if (updatedStartDate && updatedEndDate) {
      where.updatedAt = {
        gte: getStartofDay(updatedStartDate),
        lte: getEndOfDay(updatedEndDate),
      };
    } else if (updatedStartDate) {
      where.updatedAt = {
        gte: getStartofDay(updatedStartDate),
      };
    } else if (updatedEndDate) {
      where.updatedAt = {
        lte: getEndOfDay(updatedEndDate),
      };
    }
    return where;
  }

  async export(body: ExportSowDto, user: RequestUser) {
    const where = this.buildWhereClause(body.filters);

    const sort = getScopeOfWorkSortInput({
      sort: body.filters.sort,
      sortDirection: body.filters.sortDirection,
      defaultSort: 'createdAt',
      modelName: Prisma.ModelName.ScopeOfWork,
    });

    return this.exportDataService.create({
      fileType: body.fileType,
      type: ExportRequestTypes.SOW_LIBRARY,
      createdById: user.connexus_user_id,
      filters: where,
      sort: sort as object,
    });
  }

  async findAll(query: GetScopeOfWorkDto) {
    const { page, limit, sort, sortDirection } = query;

    const where = this.buildWhereClause(query);

    const paginationInput = getPaginationInput({ page, limit });
    const orderBy = getScopeOfWorkSortInput({
      sort,
      sortDirection: sortDirection || 'desc',
      defaultSort: 'createdAt',
      modelName: Prisma.ModelName.ScopeOfWork,
    });

    const [data, pagination] = await this.prismaService.client.scopeOfWork
      .paginate({
        where,
        orderBy,
        select: {
          id: true,
          scopeName: true,
          scopeType: true,
          scopeOfWorkStatus: true,
          createdAt: true,
          updatedAt: true,
          service: {
            select: {
              id: true,
              servicesName: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
          modifiedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
          scopeOfWorkVersion: {
            where: { isCurrent: true },
            select: {
              id: true,
              versionNumber: true,
              fileName: true,
              sourceFileUrl: true,
              content: true,
              createdAt: true,
              createdBy: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      })
      .withPages(paginationInput);

    return {
      data,
      pagination,
    };
  }

  async findOne(id: string) {
    const scopeOfWork = await this.prismaService.client.scopeOfWork.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        service: true,
        client: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        scopeOfWorkVersion: {
          where: { isCurrent: true },
          select: {
            id: true,
            versionNumber: true,
            fileName: true,
            sourceFileUrl: true,
            content: true,
            createdAt: true,
            status: true,
            createdBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        modifiedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!scopeOfWork) {
      throw new NotFoundException(`Scope of work with ID ${id} not found`);
    }

    return scopeOfWork;
  }

  async update(
    id: string,
    updateScopeOfWorkDto: UpdateScopeOfWorkDto,
    user: RequestUser,
  ) {
    // First check if the scope of work exists
    const existingScope =
      await this.prismaService.client.scopeOfWork.findUnique({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          client: true,
        },
      });

    if (!existingScope) {
      throw new NotFoundException(`Scope of work with ID ${id} not found`);
    }

    let newVersion: ScopeOfWorkVersion | null = null;
    const hasFileChanged =
      updateScopeOfWorkDto.fileUrl && updateScopeOfWorkDto.fileName;

    const isDocument = hasFileChanged
      ? checkIsDoc(updateScopeOfWorkDto.fileName)
      : true;

    const updatedScopeOfWork = await this.prismaService.client.$transaction(
      async (tx) => {
        let sowStatus: ScopeOfWorkStatuses = hasFileChanged
          ? ScopeOfWorkStatuses.PROCESSING
          : updateScopeOfWorkDto.scopeOfWorkStatus;

        if (hasFileChanged && isDocument) {
          sowStatus = ScopeOfWorkStatuses.ACTIVE;
        }

        const updatedScope = await tx.scopeOfWork.update({
          where: { id },
          data: {
            scopeName: updateScopeOfWorkDto.scopeName,
            modifiedById: user.connexus_user_id,
            scopeOfWorkStatus: sowStatus,
            serviceId: updateScopeOfWorkDto.serviceId,
          },
          include: {
            service: true,
            client: true,
            createdBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
            modifiedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        });

        if (hasFileChanged) {
          const maxVersion = await tx.scopeOfWorkVersion.findFirst({
            where: { scopeOfWorkId: id },
            orderBy: { versionNumber: 'desc' },
          });
          const newVersionNumber = maxVersion
            ? maxVersion.versionNumber + 1
            : 1;

          await tx.scopeOfWorkVersion.updateMany({
            where: {
              scopeOfWorkId: id,
              isCurrent: true,
            },
            data: {
              isCurrent: false,
            },
          });

          newVersion = await tx.scopeOfWorkVersion.create({
            data: {
              scopeOfWorkId: id,
              versionNumber: newVersionNumber,
              fileName: updateScopeOfWorkDto.fileName,
              sourceFileUrl: updateScopeOfWorkDto.fileUrl,
              content: !isDocument ? null : updateScopeOfWorkDto.fileUrl,
              isCurrent: true,
              createdById: user.connexus_user_id,
              uploadedById: user.connexus_user_id,
              uploadedAt: new Date(),
              status: !isDocument
                ? ScopeOfWorkVersionStatuses.PROCESSING
                : ScopeOfWorkVersionStatuses.COMPLETED,
              updatedAt: null,
            },
          });
        }

        return updatedScope;
      },
    );

    if (newVersion && !isDocument) {
      this.processDocument({
        filePath: newVersion.sourceFileUrl,
        tenantId: existingScope?.client?.tenantId,
        scopeId: id,
        type: existingScope.scopeType,
        version: newVersion.versionNumber,
        versionId: newVersion.id,
      });
    }

    return updatedScopeOfWork;
  }

  async remove(id: string, user: RequestUser) {
    // First check if the scope of work exists
    const existingScope =
      await this.prismaService.client.scopeOfWork.findUnique({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!existingScope) {
      throw new NotFoundException(`Scope of work with ID ${id} not found`);
    }

    // Soft delete the scope of work
    await this.prismaService.client.scopeOfWork.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        modifiedById: user.connexus_user_id,
      },
    });

    return {
      message: 'Scope of work deleted successfully',
    };
  }

  async getVersionHistory(query: GetVersionHistoryDto) {
    const {
      page,
      limit,
      scopeOfWorkId,
      status,
      search,
      createdById,
      createdStartDate,
      createdEndDate,
      updatedStartDate,
      updatedEndDate,
      uploadedStartDate,
      uploadedEndDate,
      isCurrentOnly,
      sort,
      sortDirection,
    } = query;

    let where: Prisma.ScopeOfWorkVersionWhereInput = {};

    // Apply filters
    if (scopeOfWorkId) {
      where.scopeOfWorkId = scopeOfWorkId;
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (search) {
      where.OR = [
        {
          fileName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          scopeOfWork: {
            scopeName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          createdBy: {
            fullName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (createdById) {
      where.createdById = createdById;
    }

    if (createdStartDate && createdEndDate) {
      where.createdAt = {
        gte: getStartofDay(createdStartDate),
        lte: getEndOfDay(createdEndDate),
      };
    } else if (createdStartDate) {
      where.createdAt = {
        gte: getStartofDay(createdStartDate),
      };
    } else if (createdEndDate) {
      where.createdAt = {
        lte: getEndOfDay(createdEndDate),
      };
    }

    // Add updated date range filters
    if (updatedStartDate && updatedEndDate) {
      where.updatedAt = {
        gte: getStartofDay(updatedStartDate),
        lte: getEndOfDay(updatedEndDate),
      };
    } else if (updatedStartDate) {
      where.updatedAt = {
        gte: getStartofDay(updatedStartDate),
      };
    } else if (updatedEndDate) {
      where.updatedAt = {
        lte: getEndOfDay(updatedEndDate),
      };
    }

    // Add uploadedAt date range filters
    if (uploadedStartDate && uploadedEndDate) {
      where.uploadedAt = {
        gte: getStartofDay(uploadedStartDate),
        lte: getEndOfDay(uploadedEndDate),
      };
    } else if (uploadedStartDate) {
      where.uploadedAt = {
        gte: getStartofDay(uploadedStartDate),
      };
    } else if (uploadedEndDate) {
      where.uploadedAt = {
        lte: getEndOfDay(uploadedEndDate),
      };
    }

    if (isCurrentOnly) {
      where.isCurrent = true;
    }

    where = {
      AND: [
        {
          isDeleted: false,
          scopeOfWork: {
            deletedAt: null,
            scopeType: {
              in: [
                ScopeOfWorkTypes.BASE_SCOPE_LIBRARY,
                ScopeOfWorkTypes.CLIENT_SCOPE_LIBRARY,
              ],
            },
          },
        },
        where,
      ],
    };

    const paginationInput = getPaginationInput({ page, limit });

    // Use existing sort utility if sort is provided, otherwise use default ordering
    const orderBy = sort
      ? getScopeOfWorkSortInput({
          sort,
          sortDirection,
          defaultSort: 'versionNumber',
          modelName: Prisma.ModelName.ScopeOfWorkVersion,
        })
      : [
          { isCurrent: 'desc' },
          { versionNumber: 'desc' },
          { createdAt: 'desc' },
        ];

    const [data, pagination] =
      await this.prismaService.client.scopeOfWorkVersion
        .paginate({
          where,
          orderBy,
          select: {
            id: true,
            scopeOfWorkId: true,
            versionNumber: true,
            fileName: true,
            sourceFileUrl: true,
            content: true,
            parentVersionId: true,
            isCurrent: true,
            status: true,
            createdAt: true,
            uploadedAt: true,
            uploadedById: true,
            uploadedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
            modifiedById: true,
            modifiedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
            updatedAt: true,
            scopeOfWork: {
              select: {
                id: true,
                scopeName: true,
                scopeType: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
            parentVersion: {
              select: {
                id: true,
                versionNumber: true,
              },
            },
          },
        })
        .withPages(paginationInput);

    return {
      data,
      pagination,
    };
  }

  async editVersionDocumentPayload(id: string, user: RequestUser) {
    const version =
      await this.prismaService.client.scopeOfWorkVersion.findUnique({
        where: {
          id,
          scopeOfWork: {
            deletedAt: null,
            scopeType: {
              in: [
                ScopeOfWorkTypes.BASE_SCOPE_LIBRARY,
                ScopeOfWorkTypes.CLIENT_SCOPE_LIBRARY,
              ],
            },
          },
        },
      });

    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }

    if (!version.content) {
      throw new BadRequestException('Version content is not available');
    }

    const userFromDb = await this.prismaService.client.users.findUniqueOrThrow({
      where: {
        id: user.connexus_user_id,
      },
    });

    if (!version.content) {
      throw new BadRequestException('Version content is not available');
    }

    const editPayload = await this.onlyOfficeService.getEditPayload({
      userName: userFromDb.fullName,
      key: version.id,
      filename: version.fileName,
      filePath: version.content,
      userId: userFromDb.id,
    });

    return editPayload;
  }

  /**
   * Download the PDF file for a Scope of Work Version by versionId.
   * @param versionId The Scope of Work Version ID.
   * @returns fileBuffer and fileName or null if not found
   */
  async downloadScopeOfWorkVersionPdf(versionId: string) {
    const version =
      await this.prismaService.client.scopeOfWorkVersion.findFirst({
        where: { id: versionId, isDeleted: false },
        select: {
          content: true,
          fileName: true,
          id: true,
          versionNumber: true,
          scopeOfWork: { select: { scopeName: true } },
        },
      });
    if (!version || !version.content) {
      throw new NotFoundException(`Version with not found`);
    }

    // Get existion of content
    const extension = version.content.split('.').pop();

    const pdfData = await this.onlyOfficeService.convertToPdf({
      filePath: version.content,
      key: version.id,
      filename: `${version.scopeOfWork.scopeName}_v${version.versionNumber}.${extension}`,
    });
    return pdfData;
  }

  /**
   * Get scope of work details with current version and optionally filter joined properties by propertyIds
   */
  async getScopeOfWorkDetails(id: string, query: GetScopeOfWorkDetailsDto) {
    const { propertyIds } = query;
    const hasPropertyIds = propertyIds && propertyIds.length > 0;
    const scopeOfWork = await this.prismaService.client.scopeOfWork.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        service: true,
        client: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        modifiedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        scopeOfWorkVersion: {
          take: Math.max(1, propertyIds?.length || 0),
          orderBy: { createdAt: 'desc' },
          where: {
            isCurrent: true,
            scopeOfWorkPropertyVersion: hasPropertyIds
              ? {
                  some: {
                    isCurrent: true,
                    scopeOfWorkProperty: {
                      propertyId: { in: propertyIds },
                    },
                  },
                }
              : undefined,
          },
          select: {
            id: true,
            versionNumber: true,
            fileName: true,
            sourceFileUrl: true,
            content: true,
            createdAt: true,
            status: true,
            isCurrent: true,
            createdBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
            uploadedById: true,
            uploadedAt: true,
            uploadedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
            scopeOfWorkPropertyVersion: {
              select: {
                id: true,
                scopeOfWorkProperty: {
                  select: {
                    id: true,
                    property: {
                      select: {
                        id: true,
                        name: true,
                        status: true,
                        type: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!scopeOfWork) {
      throw new NotFoundException(`Scope of work with ID ${id} not found`);
    }
    return scopeOfWork;
  }
}
