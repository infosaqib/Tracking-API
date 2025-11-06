import { ExportDataService } from '@app/export-data';
import { ExportRequestTypes } from '@app/export-data/dto';
import { PrismaService } from '@app/prisma';
import {
  getEndOfDay,
  getPaginationInput,
  getSortInput,
  getStartofDay,
  RequestUser,
} from '@app/shared';
import {
  AccessLevel,
  FileType,
  getStorageKey,
  S3Service,
  storageFolderNames,
  UploadFileInput,
  UploadType,
} from '@app/shared/s3';
import { getSowVersionS3Key } from '@app/shared/s3/helpers/sow-version-path.util';

import { SqsService } from '@app/shared/sqs';
import {
  ClientScopeOfWorkDocumentUploadInput,
  GenerateSowDocTemplateInput,
} from '@app/shared/sqs/types/contract-upload-input';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PropertyStatuses,
  ScopeOfWorkStatuses,
  ScopeOfWorkTypes,
  ScopeOfWorkVersion,
  ScopeOfWorkVersionStatuses,
  TemplateGenerationStatuses,
  TemplateGenerationTypes,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { OnlyOfficeService } from '../only-office/only-office.service';
import getScopeOfWorkSortInput from '../scope-of-work/utils/scope-of-work-sort.utils';
import { CopyVersionsToProperties } from './dto/copy-versions-to-properties';
import { CreateClientScopeOfWorkFromMarkdownDto } from './dto/create-client-scope-of-work-from-markdown.dto';
import { CreateClientScopeOfWorkDto } from './dto/create-client-scope-of-work.dto';
import { ExportClientSowDto } from './dto/export-client-sow.dto';
import { GetAllPropertiesDto } from './dto/get-all-properties.dto';
import { GetClientScopeOfWorkDto } from './dto/get-client-scope-of-work.dto';
import { GetPropertyForRfpDto } from './dto/get-property-for-rfp';
import { GetScopeOfWorkPropertyVersionDto } from './dto/get-scope-of-work-property-version.dto';
import { GetScopeOfWorkPropertyDto } from './dto/get-scope-of-work-property.dto';
import { GetSowTemplateDto } from './dto/get-sow-template.dto';
import { UpdateClientScopeOfWorkDto } from './dto/update-client-scope-of-work.dto';
import getClientScopeOfWorkSortInput from './utils/client-scope-of-work-sort.utils';

@Injectable()
export class ClientScopeOfWorkService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sqsService: SqsService,
    private readonly onlyOfficeService: OnlyOfficeService,
    private readonly s3Service: S3Service,
    private readonly exportDataService: ExportDataService,
  ) {}

  private readonly logger = new Logger(ClientScopeOfWorkService.name);

  async processDocument(
    scopeOfWork: ClientScopeOfWorkDocumentUploadInput['input'],
  ) {
    await this.sqsService.sendClientScopeOfWorkDocumentSQSMessage({
      jobType: 'CLIENT_SCOPE_OF_WORK_DOCUMENT_PROCESSING',
      input: scopeOfWork,
    });
  }

  async create(
    createClientScopeOfWorkDto: CreateClientScopeOfWorkDto,
    user: RequestUser,
  ) {
    this.validateCreationType(createClientScopeOfWorkDto);
    await this.ensureUniqueScopeName(
      createClientScopeOfWorkDto.scopeName,
      createClientScopeOfWorkDto.clientId,
    );

    // Check client is valid
    const client = await this.prismaService.client.client.findUnique({
      where: {
        id: createClientScopeOfWorkDto.clientId,
      },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (createClientScopeOfWorkDto.serviceId) {
      const service = await this.prismaService.client.services.findUnique({
        where: {
          id: createClientScopeOfWorkDto.serviceId,
        },
      });

      if (!service) {
        throw new NotFoundException('Service not found');
      }
    }

    const propertiesToAssociate = await this.getPropertiesToAssociate(
      createClientScopeOfWorkDto,
    );
    if (createClientScopeOfWorkDto.sourceId) {
      return this.createFromSourceId(
        createClientScopeOfWorkDto,
        user,
        propertiesToAssociate,
      );
    }
    return this.createFromFileUpload(
      createClientScopeOfWorkDto,
      user,
      propertiesToAssociate,
    );
  }

  private validateCreationType(dto: CreateClientScopeOfWorkDto) {
    const isSourceId = !!dto.sourceId;
    const isFileUpload = !!dto.fileName && !!dto.fileUrl;
    if ((isSourceId && isFileUpload) || (!isSourceId && !isFileUpload)) {
      throw new BadRequestException(
        'Provide either sourceId or fileName+fileUrl, not both or neither.',
      );
    }
  }

  private async ensureUniqueScopeName(scopeName: string, clientId: string) {
    const existingScope = await this.prismaService.client.scopeOfWork.findFirst(
      {
        where: {
          scopeName: { equals: scopeName, mode: 'insensitive' },
          deletedAt: null,
          scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
          clientId,
        },
      },
    );
    if (existingScope) {
      throw new BadRequestException(
        'Client scope of work name must be unique for this client',
      );
    }
  }

  private async getPropertiesToAssociate(
    dto: CreateClientScopeOfWorkDto,
  ): Promise<string[]> {
    if (dto.propertySelectionType === 'all') {
      const activeProperties =
        await this.prismaService.client.clientProperties.findMany({
          where: {
            clientId: dto.clientId,
            status: PropertyStatuses.ACTIVE,
            deletedAt: null,
          },
          select: { id: true },
        });
      if (activeProperties.length === 0) {
        throw new BadRequestException(
          'No active properties found for this client',
        );
      }
      return activeProperties.map((prop) => prop.id);
    }
    if (!dto.propertyIds || dto.propertyIds.length === 0) {
      throw new BadRequestException(
        'Property IDs are required when property selection type is "specific"',
      );
    }
    const validProperties =
      await this.prismaService.client.clientProperties.findMany({
        where: {
          id: { in: dto.propertyIds },
          clientId: dto.clientId,
          status: PropertyStatuses.ACTIVE,
          deletedAt: null,
        },
        select: { id: true },
      });
    if (validProperties.length !== dto.propertyIds.length) {
      throw new BadRequestException(
        'Some property IDs are invalid or do not belong to this client',
      );
    }
    return dto.propertyIds;
  }

  private async createFromSourceId(
    dto: CreateClientScopeOfWorkDto,
    user: RequestUser,
    propertiesToAssociate: string[],
  ) {
    const sourceScope = await this.prismaService.client.scopeOfWork.findUnique({
      where: { id: dto.sourceId, deletedAt: null },
      include: { scopeOfWorkVersion: { where: { isCurrent: true }, take: 1 } },
    });
    if (
      !sourceScope ||
      (sourceScope.scopeType !== ScopeOfWorkTypes.BASE_SCOPE_LIBRARY &&
        sourceScope.scopeType !== ScopeOfWorkTypes.CLIENT_SCOPE_LIBRARY)
    ) {
      throw new BadRequestException(
        'Invalid sourceId: must be a library scope',
      );
    }
    const sourceVersion = sourceScope.scopeOfWorkVersion[0];
    if (!sourceVersion || !sourceVersion.content) {
      throw new NotFoundException(
        'Source scope does not have a current version with content',
      );
    }

    const outputKeys: string[] = [];

    const scopeOfWork = await this.prismaService.client.$transaction(
      async (tx) => {
        const newScopeOfWork = await tx.scopeOfWork.create({
          data: {
            scopeName: dto.scopeName,
            description: dto.description,
            scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
            createdById: user.connexus_user_id,
            clientId: dto.clientId,
            serviceId: dto.serviceId,
            sourceId: dto.sourceId,
            scopeOfWorkStatus: ScopeOfWorkStatuses.ACTIVE,
            updatedAt: null,
          },
          include: {
            service: true,
            client: true,
            createdBy: { select: { id: true, fullName: true } },
          },
        });
        const scopeOfWorkProperties = await Promise.all(
          propertiesToAssociate.map((propertyId) =>
            tx.scopeOfWorkProperty.create({
              data: { scopeOfWorkId: newScopeOfWork.id, propertyId },
            }),
          ),
        );

        const propertyVersions = await Promise.all(
          scopeOfWorkProperties.map(async (sowProperty) => {
            const newKey = `${storageFolderNames.private}/${storageFolderNames.scopeOfWork}/${newScopeOfWork.id}/${sowProperty.propertyId}/${sourceVersion.fileName}`;
            outputKeys.push(newKey);
            return tx.scopeOfWorkPropertyVersion.create({
              data: {
                scopeOfWorkProperty: { connect: { id: sowProperty.id } },
                isCurrent: true,
                scopeOfWorkVersion: {
                  create: {
                    scopeOfWorkId: newScopeOfWork.id,
                    createdById: user.connexus_user_id,
                    isCurrent: true,
                    versionNumber: 1,
                    sourceFileUrl: sourceVersion.sourceFileUrl,
                    content: newKey,
                    fileName: sourceVersion.fileName,
                    status: ScopeOfWorkVersionStatuses.COMPLETED,
                    uploadedAt: new Date(),
                    uploadedById: user.connexus_user_id,
                    updatedAt: null,
                  },
                },
              },
              include: { scopeOfWorkVersion: true },
            });
          }),
        );
        await this.s3Service.copyFileToMultipleLocations({
          sourceKey: sourceVersion.content,
          destinationKeys: outputKeys,
        });
        return { ...newScopeOfWork, propertyVersions };
      },
    );
    return scopeOfWork;
  }

  private async createFromFileUpload(
    dto: CreateClientScopeOfWorkDto,
    user: RequestUser,
    propertiesToAssociate: string[],
  ) {
    const fileExtension = dto.fileUrl.split('.').pop();
    const isDocument =
      fileExtension.toLowerCase() === 'docx' ||
      fileExtension.toLowerCase() === 'doc';

    const outputKeys: string[] = [];

    const scopeOfWork = await this.prismaService.client.$transaction(
      async (tx) => {
        const newScopeOfWork = await tx.scopeOfWork.create({
          data: {
            scopeName: dto.scopeName,
            description: dto.description,
            scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
            createdById: user.connexus_user_id,
            clientId: dto.clientId,
            serviceId: dto.serviceId,
            updatedAt: null,
            scopeOfWorkStatus: !isDocument
              ? ScopeOfWorkStatuses.PROCESSING
              : ScopeOfWorkStatuses.ACTIVE,
          },
          include: {
            service: true,
            client: true,
            createdBy: { select: { id: true, fullName: true } },
          },
        });
        const scopeOfWorkProperties = await Promise.all(
          propertiesToAssociate.map((propertyId) =>
            tx.scopeOfWorkProperty.create({
              data: { scopeOfWorkId: newScopeOfWork.id, propertyId },
            }),
          ),
        );
        const propertyVersions = await Promise.all(
          scopeOfWorkProperties.map(async (sowProperty) => {
            let contentKey: string | null = null;

            if (isDocument) {
              // Generate unique S3 key for each property
              const newKey = `${storageFolderNames.private}/${storageFolderNames.scopeOfWork}/${newScopeOfWork.id}/${sowProperty.propertyId}/${dto.fileName}`;
              outputKeys.push(newKey);
              contentKey = newKey;
            }

            return tx.scopeOfWorkPropertyVersion.create({
              data: {
                scopeOfWorkProperty: { connect: { id: sowProperty.id } },
                isCurrent: true,
                scopeOfWorkVersion: {
                  create: {
                    scopeOfWorkId: newScopeOfWork.id,
                    createdById: user.connexus_user_id,
                    isCurrent: true,
                    versionNumber: 1,
                    sourceFileUrl: dto.fileUrl,
                    content: !isDocument ? null : contentKey,
                    fileName: dto.fileName,
                    status: !isDocument
                      ? ScopeOfWorkVersionStatuses.PROCESSING
                      : ScopeOfWorkVersionStatuses.COMPLETED,
                    uploadedAt: new Date(),
                    uploadedById: user.connexus_user_id,
                    updatedAt: null,
                  },
                },
              },
              include: { scopeOfWorkVersion: true },
            });
          }),
        );
        return { ...newScopeOfWork, propertyVersions };
      },
    );

    // Copy the uploaded file to each property's location for documents
    if (isDocument && outputKeys.length > 0) {
      await this.s3Service.copyFileToMultipleLocations({
        sourceKey: dto.fileUrl,
        destinationKeys: outputKeys,
      });
    }

    if (!isDocument && scopeOfWork.propertyVersions.length > 0) {
      const jobType =
        fileExtension.toLowerCase() === 'md'
          ? 'CLIENT_SCOPE_OF_WORK_MARKDOWN_PROCESSING'
          : 'CLIENT_SCOPE_OF_WORK_DOCUMENT_PROCESSING';
      const firstVersion = scopeOfWork.propertyVersions[0].scopeOfWorkVersion;
      this.processDocument({
        jobType,
        filePath: firstVersion.sourceFileUrl,
        tenantId: scopeOfWork.client.tenantId,
        scopeId: scopeOfWork.id,
        scopeOfWorkVersionIds: scopeOfWork.propertyVersions.map(
          (version) => version.scopeOfWorkVersion.id,
        ),
      });
    }
    return scopeOfWork;
  }

  async createFromMarkdown(
    createClientScopeOfWorkFromMarkdownDto: CreateClientScopeOfWorkFromMarkdownDto,
    user: RequestUser,
  ) {
    const { markdownContent, scopeName, ...otherFields } =
      createClientScopeOfWorkFromMarkdownDto;

    // Ensure fileName has .md extension
    const fileNameWithExtension = `${scopeName}_generated_sow.md`;

    // Generate storage key for the markdown file
    const key = getStorageKey({
      accessLevel: AccessLevel.PRIVATE,
      fileType: FileType.MD,
      resourceId: randomUUID(),
      uploadType: UploadType.SCOPE_OF_WORK,
      fileName: fileNameWithExtension,
    });

    // Upload markdown content to S3
    const input: UploadFileInput = {
      key,
      body: Buffer.from(markdownContent, 'utf-8'),
      contentType: 'text/markdown',
    };

    await this.s3Service.uploadFile(input);

    // Create the scope of work using existing file upload logic
    const createDto: CreateClientScopeOfWorkDto = {
      ...otherFields,
      fileName: fileNameWithExtension,
      fileUrl: key,
      scopeName,
    };

    return this.create(createDto, user);
  }

  async findAll(query: GetClientScopeOfWorkDto) {
    const {
      page,
      limit,
      sort,
      sortDirection,
      propertyLimitPerRecord = 3,
    } = query;

    const { where, scopeOfWorkVersionWhere } = this.buildWhereClause(query);

    const paginationInput = getPaginationInput({ page, limit });
    const orderBy = getClientScopeOfWorkSortInput({
      sort,
      sortDirection,
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
          description: true,
          scopeType: true,
          scopeOfWorkStatus: true,
          themeType: true,
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
              tenantId: true,
            },
          },
          source: {
            select: {
              id: true,
              scopeName: true,
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
          scopeOfWorkProperty: {
            take: propertyLimitPerRecord,
            select: {
              id: true,
              property: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  status: true,
                  state: true,
                },
              },
            },
          },
          scopeOfWorkVersion: {
            where: scopeOfWorkVersionWhere,
            select: {
              id: true,
              versionNumber: true,
              fileName: true,
              sourceFileUrl: true,
              createdAt: true,
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
              status: true,
            },
          },
          _count: {
            select: {
              scopeOfWorkProperty: true,
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

  private buildWhereClause(filters: GetClientScopeOfWorkDto): {
    where: Prisma.ScopeOfWorkWhereInput;
    scopeOfWorkVersionWhere: Prisma.ScopeOfWorkVersionWhereInput;
  } {
    const {
      search,
      scopeOfWorkStatus,
      serviceId,
      clientId,
      propertyId,
      createdById,
      modifiedById,
      createdStartDate,
      createdEndDate,
      updatedStartDate,
      updatedEndDate,
      uploadedStartDate,
      uploadedEndDate,
    } = filters;

    const where: Prisma.ScopeOfWorkWhereInput = {
      deletedAt: null,
      scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
    };

    // Apply filters
    if (search) {
      where.scopeName = {
        contains: search,
        mode: 'insensitive',
      };
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

    if (propertyId && propertyId.length > 0) {
      where.scopeOfWorkProperty = {
        some: {
          propertyId: { in: propertyId },
        },
      };
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

    // Prepare uploadedAt filter for current version
    const scopeOfWorkVersionWhere: Prisma.ScopeOfWorkVersionWhereInput = {
      isCurrent: true,
    };
    if (uploadedStartDate || uploadedEndDate) {
      scopeOfWorkVersionWhere.uploadedAt = {};
      if (uploadedStartDate) {
        scopeOfWorkVersionWhere.uploadedAt.gte =
          getStartofDay(uploadedStartDate);
      }
      if (uploadedEndDate) {
        scopeOfWorkVersionWhere.uploadedAt.lte = getEndOfDay(uploadedEndDate);
      }
    }

    return { where, scopeOfWorkVersionWhere };
  }

  async export(body: ExportClientSowDto, user: RequestUser) {
    const { where } = this.buildWhereClause(body.filters);

    const sort = getClientScopeOfWorkSortInput({
      sort: body.filters.sort,
      sortDirection: body.filters.sortDirection,
      defaultSort: 'createdAt',
      modelName: Prisma.ModelName.ScopeOfWork,
    });

    return this.exportDataService.create({
      fileType: body.fileType,
      type: ExportRequestTypes.CLIENT_SOW,
      createdById: user.connexus_user_id,
      filters: where,
      sort: sort as object,
    });
  }

  async findOne(id: string) {
    const scopeOfWork = await this.prismaService.client.scopeOfWork.findUnique({
      where: {
        id,
        deletedAt: null,
        scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
      },
      select: {
        id: true,
        scopeName: true,
        description: true,
        scopeType: true,
        scopeOfWorkStatus: true,
        createdAt: true,
        updatedAt: true,
        service: {
          select: {
            id: true,
            servicesName: true,
            category: true,
            serviceCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        source: {
          select: {
            id: true,
            scopeName: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            tenantId: true,
            type: true,
            logoUrl: true,
            themeHeaderImageUrl: true,
            description: true,
            legalName: true,
          },
        },
        themeType: true,
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
        _count: {
          select: {
            scopeOfWorkProperty: true,
          },
        },
        scopeOfWorkProperty: {
          select: {
            id: true,
            property: { select: { id: true, name: true, status: true } },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!scopeOfWork) {
      throw new NotFoundException(
        `Client scope of work with ID ${id} not found`,
      );
    }

    return scopeOfWork;
  }

  async update(
    id: string,
    updateClientScopeOfWorkDto: UpdateClientScopeOfWorkDto,
    user: RequestUser,
  ) {
    // First check if the scope of work exists
    const existingScope =
      await this.prismaService.client.scopeOfWork.findUnique({
        where: {
          id,
          deletedAt: null,
          scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
        },
        include: {
          client: true,
          scopeOfWorkProperty: {
            select: {
              id: true,
              propertyId: true,
            },
          },
        },
      });

    if (!existingScope) {
      throw new NotFoundException(
        `Client scope of work with ID ${id} not found`,
      );
    }

    // Guard: If serviceId is changing, ensure no RFP is connected to this SOW
    if (
      updateClientScopeOfWorkDto.serviceId &&
      updateClientScopeOfWorkDto.serviceId !== existingScope.serviceId
    ) {
      const rfpSowCount = await this.prismaService.client.rfpScopeOfWork.count({
        where: { scopeOfWorkId: id, deletedAt: null },
      });
      if (rfpSowCount > 0) {
        throw new BadRequestException(
          'Cannot update service for a scope of work linked to an RFP',
        );
      }
    }

    // Check if scope name is being updated and ensure uniqueness
    if (
      updateClientScopeOfWorkDto.scopeName &&
      updateClientScopeOfWorkDto.scopeName !== existingScope.scopeName
    ) {
      const existingScopeWithName =
        await this.prismaService.client.scopeOfWork.findFirst({
          where: {
            scopeName: {
              equals: updateClientScopeOfWorkDto.scopeName,
              mode: 'insensitive',
            },
            deletedAt: null,
            scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
            clientId: existingScope.clientId,
            id: { not: id },
          },
        });

      if (existingScopeWithName) {
        throw new BadRequestException(
          'Client scope of work name must be unique for this client',
        );
      }
    }

    // Handle property updates if propertyIds are provided
    let propertiesToAssociate: string[] = [];
    if (updateClientScopeOfWorkDto.propertyIds !== undefined) {
      if (updateClientScopeOfWorkDto.propertyIds.length === 0) {
        throw new BadRequestException(
          'At least one property must be associated with the scope of work',
        );
      }

      // Validate that all provided property IDs exist and belong to the client
      const validProperties =
        await this.prismaService.client.clientProperties.findMany({
          where: {
            id: { in: updateClientScopeOfWorkDto.propertyIds },
            clientId: existingScope.clientId,
            status: PropertyStatuses.ACTIVE,
            deletedAt: null,
          },
          select: { id: true },
        });

      if (
        validProperties.length !== updateClientScopeOfWorkDto.propertyIds.length
      ) {
        throw new BadRequestException(
          'Some property IDs are invalid or do not belong to this client',
        );
      }

      propertiesToAssociate = updateClientScopeOfWorkDto.propertyIds;
    }

    // Use transaction to ensure data consistency
    const updatedScopeOfWork = await this.prismaService.client.$transaction(
      async (tx) => {
        // Update main scope fields
        const updated = await tx.scopeOfWork.update({
          where: { id },
          data: {
            scopeName: updateClientScopeOfWorkDto.scopeName,
            description: updateClientScopeOfWorkDto.description,
            scopeOfWorkStatus: updateClientScopeOfWorkDto.scopeOfWorkStatus,
            themeType: updateClientScopeOfWorkDto.themeType,
            serviceId: updateClientScopeOfWorkDto.serviceId,
            modifiedById: user.connexus_user_id,
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

        // Handle property updates if propertyIds are provided
        // Note: Existing properties are left completely untouched
        if (updateClientScopeOfWorkDto.propertyIds !== undefined) {
          const currentPropertyIds = existingScope.scopeOfWorkProperty.map(
            (prop) => prop.propertyId,
          );

          // Identify only new properties to add (existing properties remain unchanged)
          const propertiesToAdd = propertiesToAssociate.filter(
            (propId) => !currentPropertyIds.includes(propId),
          );

          // Identify properties to remove (properties no longer in the list)
          const propertiesToRemove = currentPropertyIds.filter(
            (propId) => !propertiesToAssociate.includes(propId),
          );

          // Remove properties that are no longer needed
          if (propertiesToRemove.length > 0) {
            await tx.scopeOfWorkProperty.deleteMany({
              where: {
                scopeOfWorkId: id,
                propertyId: { in: propertiesToRemove },
              },
            });
          }

          // Add only new properties (existing properties are not modified)
          if (propertiesToAdd.length > 0) {
            // Check if there's a current version to copy from existing properties
            let existingVersion: ScopeOfWorkVersion | null = null;

            // Find the existing version to copy from:
            // - If this scope has a source (copied from library), use the current version from the source
            // - Otherwise, use the first version of this scope itself
            if (existingScope.sourceId) {
              existingVersion = await tx.scopeOfWorkVersion.findFirst({
                where: {
                  scopeOfWorkId: existingScope.sourceId,
                  isCurrent: true,
                },
              });
            } else {
              existingVersion = await tx.scopeOfWorkVersion.findFirst({
                where: {
                  scopeOfWorkId: existingScope.id,
                  versionNumber: 1,
                },
                orderBy: {
                  createdAt: 'desc',
                },
              });
            }

            // Create scope of work property associations for new properties only
            const newScopeOfWorkProperties = await Promise.all(
              propertiesToAdd.map((propertyId) =>
                tx.scopeOfWorkProperty.create({
                  data: { scopeOfWorkId: id, propertyId },
                }),
              ),
            );

            if (!existingVersion?.content) {
              throw new BadRequestException('No version found to copy from');
            }

            // Create versions for new properties only (existing property versions remain unchanged)
            if (existingVersion?.content) {
              const outputKeys: string[] = [];

              await Promise.all(
                newScopeOfWorkProperties.map(async (sowProperty) => {
                  const newKey = `${storageFolderNames.private}/${storageFolderNames.scopeOfWork}/${id}/${sowProperty.propertyId}/${existingVersion.fileName}`;
                  outputKeys.push(newKey);

                  return tx.scopeOfWorkPropertyVersion.create({
                    data: {
                      scopeOfWorkProperty: { connect: { id: sowProperty.id } },
                      isCurrent: true,
                      scopeOfWorkVersion: {
                        create: {
                          scopeOfWorkId: id,
                          createdById: user.connexus_user_id,
                          isCurrent: true,
                          versionNumber: existingVersion.versionNumber,
                          sourceFileUrl: existingVersion.sourceFileUrl,
                          content: newKey,
                          fileName: existingVersion.fileName,
                          status: existingVersion.status,
                          uploadedAt: new Date(),
                          uploadedById: user.connexus_user_id,
                          updatedAt: null,
                        },
                      },
                    },
                  });
                }),
              );

              // Copy the file to new locations for new properties only
              if (outputKeys.length > 0) {
                await this.s3Service.copyFileToMultipleLocations({
                  sourceKey: existingVersion.content,
                  destinationKeys: outputKeys,
                });
              }
            }
          }
        }

        return updated;
      },
    );

    return updatedScopeOfWork;
  }

  async remove(id: string, user: RequestUser) {
    // First check if the scope of work exists
    const existingScope =
      await this.prismaService.client.scopeOfWork.findUnique({
        where: {
          id,
          deletedAt: null,
          scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
        },
      });

    if (!existingScope) {
      throw new NotFoundException(
        `Client scope of work with ID ${id} not found`,
      );
    }

    // Soft delete the scope of work
    await this.prismaService.client.scopeOfWork.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        modifiedBy: {
          connect: {
            id: user.connexus_user_id,
          },
        },
      },
    });

    return {
      message: 'Client scope of work deleted successfully',
    };
  }

  async editVersionDocumentPayload(id: string, user: RequestUser) {
    // First, get the property ID from the passed version ID
    const propertyVersionInfo =
      await this.prismaService.client.scopeOfWorkPropertyVersion.findUnique({
        where: { id },
        select: {
          scopeOfWorkProperty: {
            select: {
              propertyId: true,
              scopeOfWork: {
                select: {
                  id: true,
                  deletedAt: true,
                  scopeType: true,
                },
              },
            },
          },
        },
      });

    if (!propertyVersionInfo) {
      throw new NotFoundException(`Property version with ID ${id} not found`);
    }

    // Validate scope of work
    if (
      propertyVersionInfo.scopeOfWorkProperty.scopeOfWork.deletedAt !== null
    ) {
      throw new NotFoundException('Scope of work has been deleted');
    }

    if (
      propertyVersionInfo.scopeOfWorkProperty.scopeOfWork.scopeType !==
      ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK
    ) {
      throw new NotFoundException('Invalid scope of work type');
    }

    // Now find the current version for this property
    const currentPropertyVersion =
      await this.prismaService.client.scopeOfWorkPropertyVersion.findFirst({
        where: {
          scopeOfWorkProperty: {
            propertyId: propertyVersionInfo.scopeOfWorkProperty.propertyId,
            scopeOfWork: {
              deletedAt: null,
              scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
              id: propertyVersionInfo.scopeOfWorkProperty.scopeOfWork.id,
            },
          },
          isCurrent: true,
          scopeOfWorkVersion: { isCurrent: true },
        },
        include: {
          scopeOfWorkVersion: true,
          scopeOfWorkProperty: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          scopeOfWorkVersion: {
            createdAt: 'desc',
          },
        },
      });

    if (!currentPropertyVersion) {
      throw new NotFoundException(
        'Current version not found for this property',
      );
    }

    if (!currentPropertyVersion.scopeOfWorkVersion.content) {
      throw new BadRequestException('Version content is not available');
    }

    const userName = `${user.given_name} ${user.family_name}`;

    const editPayload = await this.onlyOfficeService.getEditPayload({
      filePath: currentPropertyVersion.scopeOfWorkVersion.content,
      userId: user.connexus_user_id,
      userName,
      key: currentPropertyVersion.scopeOfWorkVersion.id,
      filename: currentPropertyVersion.scopeOfWorkVersion.fileName,
    });

    return {
      ...editPayload,
      propertyInfo: {
        id: currentPropertyVersion.scopeOfWorkProperty.property.id,
        name: currentPropertyVersion.scopeOfWorkProperty.property.name,
      },
    };
  }

  async findAllPropertyVersions(query: GetScopeOfWorkPropertyVersionDto) {
    const {
      page,
      limit,
      scopeOfWorkPropertyId,
      scopeOfWorkVersionId,
      propertyName,
      search,
      sort,
      sortDirection,
      createdStartDate,
      createdEndDate,
      updatedStartDate,
      updatedEndDate,
      uploadedStartDate,
      uploadedEndDate,
    } = query;
    const where: Prisma.ScopeOfWorkPropertyVersionWhereInput = {
      scopeOfWorkProperty: {
        scopeOfWork: {
          scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
          deletedAt: null,
        },
      },
    };
    if (scopeOfWorkPropertyId) {
      where.scopeOfWorkPropertyId = scopeOfWorkPropertyId;
    }
    if (scopeOfWorkVersionId) {
      where.scopeOfWorkVersionId = scopeOfWorkVersionId;
    }
    let andArray: Prisma.ScopeOfWorkPropertyVersionWhereInput[] = [];
    if (Array.isArray(where.AND)) {
      andArray = where.AND;
    } else if (where.AND) {
      andArray = [where.AND];
    }
    if (propertyName) {
      andArray.push({
        scopeOfWorkProperty: {
          property: {
            name: { contains: propertyName, mode: 'insensitive' },
          },
        },
      });
    }
    if (search) {
      andArray.push({
        OR: [
          {
            scopeOfWorkProperty: {
              property: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
          {
            scopeOfWorkVersion: {
              fileName: { contains: search, mode: 'insensitive' },
            },
          },
          {
            scopeOfWorkVersion: {
              createdBy: {
                fullName: { contains: search, mode: 'insensitive' },
              },
            },
          },
        ],
      });
    }

    // Add date range filters
    if (createdStartDate && createdEndDate) {
      andArray.push({
        createdAt: {
          gte: getStartofDay(createdStartDate),
          lte: getEndOfDay(createdEndDate),
        },
      });
    } else if (createdStartDate) {
      andArray.push({
        createdAt: {
          gte: getStartofDay(createdStartDate),
        },
      });
    } else if (createdEndDate) {
      andArray.push({
        createdAt: {
          lte: getEndOfDay(createdEndDate),
        },
      });
    }

    if (updatedStartDate && updatedEndDate) {
      andArray.push({
        modifiedAt: {
          gte: getStartofDay(updatedStartDate),
          lte: getEndOfDay(updatedEndDate),
        },
      });
    } else if (updatedStartDate) {
      andArray.push({
        modifiedAt: {
          gte: getStartofDay(updatedStartDate),
        },
      });
    } else if (updatedEndDate) {
      andArray.push({
        modifiedAt: {
          lte: getEndOfDay(updatedEndDate),
        },
      });
    }

    // Add uploaded date range filters
    if (uploadedStartDate && uploadedEndDate) {
      andArray.push({
        scopeOfWorkVersion: {
          uploadedAt: {
            gte: getStartofDay(uploadedStartDate),
            lte: getEndOfDay(uploadedEndDate),
          },
        },
      });
    } else if (uploadedStartDate) {
      andArray.push({
        scopeOfWorkVersion: {
          uploadedAt: {
            gte: getStartofDay(uploadedStartDate),
          },
        },
      });
    } else if (uploadedEndDate) {
      andArray.push({
        scopeOfWorkVersion: {
          uploadedAt: {
            lte: getEndOfDay(uploadedEndDate),
          },
        },
      });
    }

    if (andArray.length > 0) {
      where.AND = andArray;
    }
    const paginationInput = getPaginationInput({ page, limit });
    const sortBy = getSortInput({
      sort,
      sortDirection,
      defaultSort: 'createdAt',
      modelName: Prisma.ModelName.ScopeOfWorkPropertyVersion,
    });

    const [data, pagination] =
      await this.prismaService.client.scopeOfWorkPropertyVersion
        .paginate({
          where,
          orderBy: sortBy,
          select: {
            id: true,
            isCurrent: true,
            createdAt: true,
            modifiedAt: true,
            scopeOfWorkProperty: {
              select: {
                id: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
                scopeOfWork: {
                  select: {
                    id: true,
                    scopeName: true,
                    clientId: true,
                  },
                },
              },
            },
            scopeOfWorkVersion: {
              select: {
                id: true,
                versionNumber: true,
                fileName: true,
                status: true,
                createdAt: true,
                content: true,
                updatedAt: true,
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
                uploadedAt: true,
                uploadedBy: {
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
    return { data, pagination };
  }

  async findOnePropertyVersion(scopeOfWorkPropertyVersionId: string) {
    const propertyVersion =
      await this.prismaService.client.scopeOfWorkPropertyVersion.findUnique({
        where: { id: scopeOfWorkPropertyVersionId },
        select: {
          id: true,
          isCurrent: true,
          createdAt: true,
          modifiedAt: true,
          scopeOfWorkProperty: {
            select: {
              id: true,
              property: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
              scopeOfWork: {
                select: {
                  id: true,
                  scopeName: true,
                  clientId: true,
                  client: {
                    select: {
                      id: true,
                      name: true,
                      tenantId: true,
                      logoUrl: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
          scopeOfWorkVersion: {
            select: {
              id: true,
              versionNumber: true,
              fileName: true,
              status: true,
              createdAt: true,
              isCurrent: true,
              updatedAt: true,
            },
          },
        },
      });
    if (!propertyVersion) {
      throw new NotFoundException(
        `ScopeOfWorkPropertyVersion with ID ${scopeOfWorkPropertyVersionId} not found`,
      );
    }
    return propertyVersion;
  }

  /**
   * Get paginated and filtered properties in a scope of work
   * @param query GetScopeOfWorkPropertyDto
   */
  async getScopeOfWorkProperties(query: GetScopeOfWorkPropertyDto) {
    const {
      page,
      limit,
      scopeOfWorkId,
      clientId,
      search,
      propertyId,
      state,
      city,
      county,
      sort,
      sortDirection,
    } = query;

    const where: Prisma.ScopeOfWorkPropertyWhereInput = {
      scopeOfWork: {
        scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
        deletedAt: null,
      },
    };

    if (scopeOfWorkId) {
      where.scopeOfWorkId = scopeOfWorkId;
    }

    if (clientId?.length > 0) {
      where.scopeOfWork = {
        clientId: { in: clientId },
      };
    }

    const propertyWhere: Prisma.ClientPropertiesWhereInput = {};

    if (propertyId?.length > 0) {
      propertyWhere.id = { in: propertyId };
    }

    if (search) {
      propertyWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (state?.length > 0) {
      propertyWhere.state = { id: { in: state } };
    }

    if (city?.length > 0) {
      propertyWhere.city = { id: { in: city } };
    }

    if (county?.length > 0) {
      propertyWhere.county = { id: { in: county } };
    }

    if (Object.keys(propertyWhere).length > 0) {
      where.property = propertyWhere;
    }

    const paginationInput = getPaginationInput({ page, limit });
    const [data, pagination] =
      await this.prismaService.client.scopeOfWorkProperty
        .paginate({
          where,
          orderBy: getScopeOfWorkSortInput({
            sort,
            sortDirection,
            defaultSort: 'createdAt',
            modelName: Prisma.ModelName.ScopeOfWorkProperty,
          }),
          select: {
            id: true,
            createdAt: true,
            property: {
              select: {
                id: true,
                name: true,
                status: true,
                address: true,
                unitCount: true,
                buildingCount: true,
                type: true,
                floorCount: true,
                city: { select: { cityName: true } },
                state: { select: { stateName: true } },
                country: { select: { countryName: true } },
                county: { select: { name: true } },
                client: {
                  select: {
                    id: true,
                    name: true,
                    tenant: { select: { id: true, name: true } },
                  },
                },
              },
            },
            scopeOfWork: {
              select: {
                id: true,
                scopeName: true,
                clientId: true,
              },
            },
            scopeOfWorkPropertyVersion: {
              where: {
                isCurrent: true,
                scopeOfWorkVersion: { isCurrent: true },
              },
              select: {
                id: true,
                isCurrent: true,
                createdAt: true,
                modifiedAt: true,
                scopeOfWorkVersion: {
                  select: {
                    id: true,
                    versionNumber: true,
                    fileName: true,
                    status: true,
                    createdAt: true,
                    content: true,
                  },
                },
              },
            },
          },
        })
        .withPages(paginationInput);
    return { data, pagination };
  }

  async getAllPropertiesInAClient(
    clientId: string,
    query: GetAllPropertiesDto,
  ) {
    const { sort, sortDirection } = query;

    const orderBy = getScopeOfWorkSortInput({
      sort,
      sortDirection,
      defaultSort: 'createdAt',
      modelName: Prisma.ModelName.ClientProperties,
    });

    const data = await this.prismaService.client.clientProperties.findMany({
      where: { clientId, status: { in: [PropertyStatuses.ACTIVE] } },
      orderBy,
      select: {
        id: true,
        name: true,
        ScopeOfWorkProperty: query.selectedScopeOfWorkId
          ? {
              where: {
                scopeOfWorkId: query.selectedScopeOfWorkId,
                scopeOfWork: {
                  deletedAt: null,
                  scopeOfWorkStatus: {
                    in: [ScopeOfWorkStatuses.ACTIVE],
                  },
                },
              },
              select: {
                id: true,
              },
            }
          : undefined,
      },
    });

    return data.map((property) => ({
      id: property.id,
      name: property.name,
      selected:
        (query.selectedScopeOfWorkId &&
          property.ScopeOfWorkProperty?.length > 0) ||
        null,
    }));
  }

  /**
   * Copies a scope of work version to multiple properties
   * @param createClientScopeOfWorkDto - DTO containing the scope of work version ID and property IDs
   * @param user - Request user object
   * @returns Confirmation message
   */
  async copyVersionToProperty(
    createClientScopeOfWorkDto: CopyVersionsToProperties,
    user: RequestUser,
  ): Promise<{ message: string }> {
    const { scopeOfVersionId, propertyIds } = createClientScopeOfWorkDto;

    const scopeOfWorkVersion =
      await this.prismaService.client.scopeOfWorkVersion.findUniqueOrThrow({
        where: { id: scopeOfVersionId },
      });

    const { scopeOfWorkId } = scopeOfWorkVersion;

    if (!scopeOfWorkVersion.content) {
      throw new BadRequestException('Scope of work version content is missing');
    }

    const outputKeys = propertyIds.map((propertyId) => {
      const scopeOfWorkPropertyVersionId = randomUUID();
      const scopeOfWorkFileName = scopeOfWorkVersion.fileName;
      const destinationKey = getSowVersionS3Key({
        scopeOfWorkId: scopeOfWorkVersion.scopeOfWorkId,
        fileName: scopeOfWorkFileName,
        versionId: scopeOfWorkPropertyVersionId,
        scopeOfWorkPropertyId: propertyId,
      });
      return {
        propertyId,
        destinationKey,
        scopeOfWorkPropertyVersionId,
        scopeOfWorkFileName,
      };
    });

    await this.s3Service.copyFileToMultipleLocations({
      sourceKey: scopeOfWorkVersion.content,
      destinationKeys: outputKeys.map((item) => item.destinationKey),
    });

    await this.prismaService.client.$transaction(async (tx) => {
      await tx.scopeOfWorkVersion.updateMany({
        where: {
          scopeOfWorkPropertyVersion: {
            some: {
              scopeOfWorkProperty: {
                propertyId: { in: propertyIds },
                scopeOfWorkId,
              },
            },
          },
          isCurrent: true,
        },
        data: { isCurrent: false },
      });

      await tx.scopeOfWorkPropertyVersion.updateMany({
        where: {
          scopeOfWorkProperty: {
            propertyId: { in: propertyIds },
            scopeOfWorkId,
          },
          isCurrent: true,
        },
        data: { isCurrent: false },
      });

      // Batch fetch all relevant scopeOfWorkProperty records
      const scopeOfWorkProperties = await tx.scopeOfWorkProperty.findMany({
        where: {
          propertyId: { in: propertyIds },
          scopeOfWorkId,
        },
        select: {
          id: true,
          propertyId: true,
          scopeOfWorkPropertyVersion: {
            where: {
              isCurrent: true,
              scopeOfWorkVersion: { isCurrent: true },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              scopeOfWorkVersion: {
                select: {
                  id: true,
                  versionNumber: true,
                },
              },
            },
          },
        },
      });

      // Map propertyId to scopeOfWorkProperty for quick lookup
      const propertyMap = new Map<string, (typeof scopeOfWorkProperties)[0]>();
      scopeOfWorkProperties.forEach((prop) => {
        propertyMap.set(prop.propertyId, prop);
      });

      await Promise.all(
        outputKeys.map(async (item) => {
          const scopeOfWorkProperty = propertyMap.get(item.propertyId);
          if (!scopeOfWorkProperty) {
            throw new NotFoundException(
              `ScopeOfWorkProperty not found for propertyId ${item.propertyId}`,
            );
          }
          const previousVersion =
            scopeOfWorkProperty.scopeOfWorkPropertyVersion[0];
          const newVersionNumber = previousVersion?.scopeOfWorkVersion
            ? previousVersion.scopeOfWorkVersion.versionNumber + 1
            : 1;

          await tx.scopeOfWorkPropertyVersion.create({
            data: {
              id: item.scopeOfWorkPropertyVersionId,
              isCurrent: true,
              scopeOfWorkProperty: {
                connect: { id: scopeOfWorkProperty.id },
              },
              scopeOfWorkVersion: {
                create: {
                  scopeOfWorkId: scopeOfWorkVersion.scopeOfWorkId,
                  createdById: user.connexus_user_id,
                  isCurrent: true,
                  versionNumber: newVersionNumber,
                  sourceFileUrl: scopeOfWorkVersion.sourceFileUrl,
                  content: item.destinationKey,
                  fileName: item.scopeOfWorkFileName,
                  status: ScopeOfWorkVersionStatuses.COMPLETED,
                  uploadedAt: new Date(),
                  uploadedById: user.connexus_user_id,
                  updatedAt: null,
                },
              },
            },
          });
        }),
      );
    });

    return {
      message: 'Version copied successfully',
    };
  }

  /**
   * Remove a ScopeOfWorkProperty by ID
   * @param id - ScopeOfWorkProperty ID
   * @returns Confirmation message
   */
  async removeProperty(id: string): Promise<{ message: string }> {
    // First check if the scope of work property exists
    const existingProperty =
      await this.prismaService.client.scopeOfWorkProperty.findUnique({
        where: {
          id,
          scopeOfWork: {
            scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
            deletedAt: null,
          },
        },
        include: {
          scopeOfWork: {
            select: {
              id: true,
              scopeName: true,
              clientId: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    if (!existingProperty) {
      throw new NotFoundException(
        `ScopeOfWorkProperty with ID ${id} not found`,
      );
    }

    // Hard delete the scope of work property (this will cascade to related records)
    await this.prismaService.client.scopeOfWorkProperty.delete({
      where: { id },
    });

    return {
      message: `Property "${existingProperty.property.name}" removed from scope of work "${existingProperty.scopeOfWork.scopeName}" successfully`,
    };
  }

  async getPropertyForRfp(query: GetPropertyForRfpDto) {
    const { rfpId, propertyIds, sowId, search, hasAttachments } = query;

    const where: Prisma.ScopeOfWorkPropertyWhereInput = {
      scopeOfWorkId: sowId,
    };

    const propertyWhere: Prisma.ClientPropertiesWhereInput = {};

    if (propertyIds && propertyIds.length > 0)
      where.propertyId = { in: propertyIds };

    if (search) propertyWhere.name = { contains: search, mode: 'insensitive' };

    // Merge hasAttachments filter with existing propertyWhere
    if (hasAttachments === true) {
      propertyWhere.rfpPropertyAttachments = {
        some: {
          rfpId,
          deletedAt: null,
          scopeOfWorkId: sowId,
        },
      };
    } else if (hasAttachments === false) {
      propertyWhere.rfpPropertyAttachments = {
        none: {
          rfpId,
          deletedAt: null,
          scopeOfWorkId: sowId,
        },
      };
    }

    if (Object.keys(propertyWhere).length > 0) {
      where.property = propertyWhere;
    }

    const pages = getPaginationInput(query);

    const orderBy = getSortInput({
      sort: query.sort,
      sortDirection: query.sortDirection || 'asc',
      defaultSort: 'property.name',
      modelName: Prisma.ModelName.ScopeOfWorkProperty,
      nestedSortLevel: 3,
    });

    const [data, pagination] =
      await this.prismaService.client.scopeOfWorkProperty
        .paginate({
          where,
          orderBy,
          select: {
            id: true,
            property: {
              select: {
                id: true,
                name: true,
                _count: {
                  select: {
                    rfpPropertyAttachments: {
                      where: {
                        deletedAt: null,
                        rfpId,
                        scopeOfWorkId: sowId,
                      },
                    },
                  },
                },
              },
            },
          },
        })
        .withPages(pages);

    return {
      data,
      pagination,
    };
  }

  async generateSowTemplate(input: GetSowTemplateDto, user: RequestUser) {
    try {
      const { forceRegeneration = true } = input;
      const response = await this.prismaService.client.$transaction(
        async (tx) => {
          // Get scope of work with all necessary relations in a single query
          const sowTemplate = await tx.scopeOfWork.findUnique({
            where: {
              id: input.clientScopeOfWorkId,
              deletedAt: null,
              scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
            },
            include: {
              client: { select: { id: true, modifiedAt: true } },
              service: { select: { id: true, modifiedAt: true } },
              scopeOfWorkProperty: {
                take: 1,
                orderBy: {
                  property: { modifiedAt: 'desc' },
                },
                include: {
                  property: { select: { id: true, modifiedAt: true } },
                },
              },
            },
          });

          if (!sowTemplate) {
            throw new NotFoundException(`Scope of work with ID not found`);
          }

          // Combined query for both pending and completed tasks
          const existingTasks = await tx.templateGenerationTasks.findMany({
            where: {
              scopeOfWorkId: sowTemplate.id,
              type: TemplateGenerationTypes.SOW,
              fileType: input.fileType,
              status: {
                in: [
                  TemplateGenerationStatuses.PENDING,
                  TemplateGenerationStatuses.COMPLETED,
                ],
              },
            },
            orderBy: [
              { status: 'asc' }, // PENDING comes before COMPLETED
              { createdAt: 'desc' },
            ],
            select: {
              id: true,
              status: true,
              type: true,
              fileType: true,
              createdAt: true,
              updatedAt: true,
              createdById: true,
              completedAt: true,
              fileUrl: true,
              scopeOfWorkId: true,
              scopeOfWork: {
                select: {
                  id: true,
                  scopeName: true,
                  clientId: true,
                },
              },
            },
          });

          // Check for pending task first
          const pendingTask = existingTasks.find(
            (task) => task.status === TemplateGenerationStatuses.PENDING,
          );
          if (pendingTask) {
            return {
              message: 'Template generation already in progress',
              templateGenerationTask: pendingTask,
            };
          }

          // Check for completed task (only if force regeneration is not requested)
          if (!forceRegeneration) {
            const completedTask = existingTasks.find(
              (task) => task.status === TemplateGenerationStatuses.COMPLETED,
            );
            if (completedTask) {
              // Check if any related data has been updated since the task was created
              const hasClientChanged =
                sowTemplate.client.modifiedAt > completedTask.createdAt;
              const hasServiceChanged =
                sowTemplate.service?.modifiedAt > completedTask.createdAt;
              const hasScopeOfWorkChanged =
                sowTemplate.updatedAt > completedTask.createdAt;
              // Check only the most recent property (if any properties exist)
              const hasPropertiesChanged =
                sowTemplate.scopeOfWorkProperty.length > 0 &&
                sowTemplate.scopeOfWorkProperty[0].property.modifiedAt >
                  completedTask.createdAt;

              // Only return completed task if no related data has changed
              if (
                !hasClientChanged &&
                !hasServiceChanged &&
                !hasScopeOfWorkChanged &&
                !hasPropertiesChanged
              ) {
                const formattedDate =
                  completedTask.createdAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                return {
                  message: `Using existing template (generated on ${formattedDate})`,
                  templateGenerationTask: completedTask,
                };
              }
            }
          }

          // Create new template generation task
          const templateGenerationTask =
            await tx.templateGenerationTasks.create({
              data: {
                scopeOfWorkId: sowTemplate.id,
                status: TemplateGenerationStatuses.PENDING,
                createdById: user.connexus_user_id,
                updatedById: user.connexus_user_id,
                type: TemplateGenerationTypes.SOW,
                fileType: input.fileType,
              },
              select: {
                id: true,
                status: true,
                type: true,
                fileType: true,
                createdAt: true,
                updatedAt: true,
                createdById: true,
                completedAt: true,
                fileUrl: true,
                scopeOfWorkId: true,
                scopeOfWork: {
                  select: {
                    id: true,
                    scopeName: true,
                    clientId: true,
                  },
                },
              },
            });

          const templateGenerationInput: GenerateSowDocTemplateInput = {
            jobType: 'GENERATE_SOW_DOCX_TEMPLATE',
            input: {
              taskId: templateGenerationTask.id,
            },
          };

          if (input.fileType === 'PDF') {
            templateGenerationInput.jobType = 'GENERATE_SOW_PDF_TEMPLATE';
          }

          await this.sqsService.generateSowTemplate(templateGenerationInput);

          return {
            message: 'Template generation started',
            templateGenerationTask,
          };
        },
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error generating SOW template: ${JSON.stringify(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get the current version of a scope of work property, including a signed URL for the file if present.
   */
  async getCurrentVersionWithSignedUrl(scopeOfWorkPropertyId: string) {
    // Find the current ScopeOfWorkVersion for the given property
    const propertyVersion =
      await this.prismaService.client.scopeOfWorkPropertyVersion.findFirst({
        where: {
          scopeOfWorkPropertyId,
          isCurrent: true,
          scopeOfWorkVersion: { isCurrent: true },
        },
        include: {
          scopeOfWorkVersion: {
            include: {
              scopeOfWork: {
                select: {
                  id: true,
                  scopeName: true,
                  clientId: true,
                },
              },
            },
          },
        },
      });
    if (!propertyVersion || !propertyVersion.scopeOfWorkVersion) {
      throw new NotFoundException(
        'Current version not found for this property',
      );
    }
    const version = propertyVersion.scopeOfWorkVersion;
    let signedUrl: string | null = null;
    if (version.content) {
      // content is the S3 key for the file
      const { url } = await this.s3Service.generateDownloadSignedUrl({
        key: version.content,
      });
      signedUrl = url;
    }
    return {
      ...version,
      signedUrl,
    };
  }
}
