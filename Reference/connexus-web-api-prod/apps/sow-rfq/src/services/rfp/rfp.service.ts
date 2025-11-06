import { PrismaService } from '@app/prisma';
import { RequestUser, getPaginationInput, getSortInput } from '@app/shared';
import { SqsService } from '@app/shared/sqs';
import { GenerateRfpDocTemplateInput } from '@app/shared/sqs/types/contract-upload-input';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PropertyBuildingTypes,
  PropertyStatuses,
  RfpPortfolioType,
  TemplateGenerationStatuses,
  TemplateGenerationTypes,
} from '@prisma/client';
import { CreateRfpDto } from './dto/create-rfp.dto';
import { GetPotentialVendorsDto } from './dto/get-potential-vendors.dto';
import { GetRfpPropertiesDto } from './dto/get-rfp-properties.dto';
import { GetRfpScopeOfWorkDto } from './dto/get-rfp-scope-of-work.dto';
import { GetRfpTemplateDto } from './dto/get-rfp-template.dto';
import { GetRfpDto } from './dto/get-rfp.dto';
import { UpdateRfpDto } from './dto/update-rfp.dto';
import {
  buildBaseVendorWhere,
  buildGeographicFilter,
  determineVendorMatch,
} from './helpers';

@Injectable()
export class RfpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sqsService: SqsService,
  ) {}

  private readonly logger = new Logger(RfpService.name);

  async checkDuplicateRfpDocumentByHash(input: {
    rfpId: string;
    fileHash: string;
  }): Promise<{
    exists: boolean;
    document?: {
      id: string;
      fileName: string;
      fileType?: string | null;
      fileSizeBytes?: bigint | null;
    };
  }> {
    const doc = await this.prisma.client.rfpDocuments.findFirst({
      where: { rfpId: input.rfpId, fileHash: input.fileHash, deletedAt: null },
      select: { id: true, fileName: true, fileType: true, fileSizeBytes: true },
    });
    if (!doc) return { exists: false };
    return { exists: true, document: doc };
  }

  private generateRfpDescription(params: {
    clientName: string;
    serviceName: string;
    portfolioType: RfpPortfolioType;
    dueByDate?: Date | null;
  }): string {
    const isProtfolio = params.portfolioType === 'MULTI_PROPERTY';
    let descrption = `${params.clientName} is looking for a ${params.serviceName} company to service its Portfolio.  Here is the key information to provide this bid:\n`;

    const points: string[] = [
      'See the full Scope Of Work (SOW) in an additional attachment within the email.',
      'A Vendor Response Sheet is required for submission of the proposal by the deadline.',
      'This Client mandates the involvement of a third-party insurance compliance company. To offer services, providers must complete the onboarding process with said third-party insurance company  if awarded the work.',
      'The Standard Contract Agreement is included, which outlines their insurance requirements.  Please review these in detail prior to providing a proposal.  The client will not accept any changes to their contract.  Please do not submit a proposal if any changes to the contract would be requested or required.',
      'Please ensure your proposal includes taxes, if applicable.  If taxes are not applicable, then please be clear that they are not applicable to your submission/service.',
      'The client has the option to choose either a single vendor for all their properties or multiple vendors. Please make sure that the pricing reflects the costs for both single-site and multiple-property scenarios.',
    ];

    // Exclude 4th element if the RFP Type is Individual
    if (!isProtfolio) {
      points.splice(3, 1);
    }

    const pointsString = points.map((d, i) => `${i + 1}. ${d}`).join('\n');

    descrption = `${descrption}\n${pointsString}`;

    const formattedDueDate = params.dueByDate
      ? `, no later than ${params.dueByDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}`
      : '';

    descrption =
      `${descrption}\n\n` +
      `To be considered for this proposal, please submit your bids promptly${formattedDueDate}. Bids can be for the full portfolio, or single communities.`;
    return descrption;
  }

  async create(createRfpDto: CreateRfpDto, user: RequestUser) {
    const {
      rfpName,
      description,
      clientId,
      serviceId,
      portfolioType,
      contractId,
      rfpDueDate,
      rfpAwardDate,
      rfqDate,
      rfiDate,
      contractStartDate,
      termOfContract,
      status,
      propertyIds,
      scopeOfWorkIds,
      documents = [],
      rfpPropertyAttachments = [],
      themeType,
      rfpExtendedDueDate,
    } = createRfpDto;

    // Build dynamic description when not provided
    const [client, service] = await Promise.all([
      this.prisma.client.client.findUnique({
        where: { id: clientId },
        select: { name: true },
      }),
      this.prisma.client.services.findUnique({
        where: { id: serviceId },
        select: { servicesName: true },
      }),
    ]);

    const finalDescription =
      description ??
      this.generateRfpDescription({
        clientName: client?.name,
        serviceName: service?.servicesName,
        portfolioType,
        dueByDate: rfpDueDate ? new Date(rfpDueDate) : null,
      });

    // Check name is unique per client
    const existingRfp = await this.prisma.client.rfps.findFirst({
      where: {
        rfpName: {
          equals: rfpName,
          mode: 'insensitive',
        },
        clientId,
        deletedAt: null,
      },
    });
    if (existingRfp) {
      throw new ConflictException('RFP name must be unique for this client');
    }

    const rfp = await this.prisma.client.$transaction(async (prisma) => {
      // 1. Create the RFP and its properties, scope of work, and documents
      const createdRfp = await prisma.rfps.create({
        data: {
          rfpName,
          description: finalDescription,
          clientId,
          portfolioType,
          contractId,
          rfpDueDate,
          rfpAwardDate,
          rfqDate,
          rfiDate,
          contractStartDate,
          termOfContract,
          status,
          serviceId,
          themeType,
          rfpExtendedDueDate,
          createdAt: new Date(),
          createdById: user.connexus_user_id,
          rfpProperties: {
            create: propertyIds.map((propertyId) => ({
              clientPropertyId: propertyId,
              createdById: user.connexus_user_id,
            })),
          },
          rfpScopeOfWork: {
            create: scopeOfWorkIds.map((scopeOfWorkId) => ({
              scopeOfWorkId,
              createdById: user.connexus_user_id,
            })),
          },
          rfpDocuments: {
            create: documents.map((doc) => ({
              fileName: doc.fileName,
              filePath: doc.filePath,
              fileType: doc.fileType,
              fileSizeBytes: doc.fileSizeBytes,
              fileHash: doc.fileHash,
              createdById: user.connexus_user_id,
            })),
          },
        },
        include: {
          rfpProperties: true,
        },
      });

      // 2. Map clientPropertyId to rfpPropertyId
      const propertyIdToRfpPropertyId = new Map<string, string>(
        createdRfp.rfpProperties.map((rfpProperty) => [
          rfpProperty.clientPropertyId,
          rfpProperty.id,
        ]),
      );

      // 3. Prepare all attachment createMany calls
      const attachmentCreatePromises = (rfpPropertyAttachments || [])
        .map((propertyAttachment) => {
          const rfpPropertyId = propertyIdToRfpPropertyId.get(
            propertyAttachment.propertyId,
          );
          if (
            !rfpPropertyId ||
            !propertyAttachment.attachments ||
            propertyAttachment.attachments.length === 0
          ) {
            return null;
          }
          return prisma.rfpPropertyAttachments.createMany({
            data: propertyAttachment.attachments.map((attachment) => ({
              rfpPropertyId,
              fileName: attachment.fileName,
              filePath: attachment.filePath,
              fileType: attachment.fileType,
              fileSizeBytes: attachment.fileSizeBytes,
              fileHash: (attachment as any).fileHash,
              createdById: user.connexus_user_id,
            })),
          });
        })
        .filter(Boolean);

      await Promise.all(attachmentCreatePromises);

      return createdRfp;
    });

    return this.findOne(rfp.id);
  }

  async findAll(query: GetRfpDto) {
    const {
      page,
      limit,
      search,
      rfpName,
      rfpIds,
      clientId,
      serviceId,
      status,
      portfolioType,
      propertyIds,
      sort,
      sortDirection,
      rfpDueDateFrom,
      rfpDueDateTo,
      rfpAwardDateFrom,
      rfpAwardDateTo,
      rfqDateFrom,
      rfqDateTo,
      themeType,
    } = query;

    const where: Prisma.RfpsWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { rfpName: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        {
          service: { servicesName: { contains: search, mode: 'insensitive' } },
        },
        {
          rfpProperties: {
            some: {
              clientProperty: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    if (rfpName) {
      where.rfpName = { contains: rfpName, mode: 'insensitive' };
    }

    if (rfpIds && rfpIds.length > 0) {
      where.id = { in: rfpIds };
    }

    if (clientId && clientId.length > 0) {
      where.clientId = { in: clientId };
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (portfolioType && portfolioType.length > 0) {
      where.portfolioType = { in: portfolioType };
    }

    if (themeType && themeType.length > 0) {
      where.themeType = { in: themeType };
    }

    if (propertyIds && propertyIds.length > 0) {
      where.rfpProperties = {
        some: {
          clientPropertyId: { in: propertyIds },
        },
      };
    }

    if (serviceId && serviceId.length > 0) {
      where.serviceId = { in: serviceId };
    }

    if (rfpDueDateFrom || rfpDueDateTo) {
      where.rfpDueDate = {};
      if (rfpDueDateFrom) {
        where.rfpDueDate.gte = new Date(rfpDueDateFrom);
      }
      if (rfpDueDateTo) {
        where.rfpDueDate.lte = new Date(rfpDueDateTo);
      }
    }

    if (rfpAwardDateFrom || rfpAwardDateTo) {
      where.rfpAwardDate = {};
      if (rfpAwardDateFrom) {
        where.rfpAwardDate.gte = new Date(rfpAwardDateFrom);
      }
      if (rfpAwardDateTo) {
        where.rfpAwardDate.lte = new Date(rfpAwardDateTo);
      }
    }

    if (rfqDateFrom || rfqDateTo) {
      where.rfqDate = {};
      if (rfqDateFrom) {
        where.rfqDate.gte = new Date(rfqDateFrom);
      }
      if (rfqDateTo) {
        where.rfqDate.lte = new Date(rfqDateTo);
      }
    }

    const paginationInput = getPaginationInput({ page, limit });
    const orderBy = getSortInput({
      sort,
      sortDirection,
      defaultSort: 'createdAt',
      modelName: Prisma.ModelName.Rfps,
      nestedSortLevel: 4,
    });

    const select: Prisma.RfpsSelect = {
      id: true,
      rfpName: true,
      description: true,
      status: true,
      rfpDueDate: true,
      createdAt: true,
      themeType: true,
      client: {
        select: {
          id: true,
          name: true,
          type: true,
          tenantId: true,
          logoUrl: true,
          themeHeaderImageUrl: true,
          description: true,
          legalName: true,
        },
      },
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
      rfpProperties: {
        take: 5,
        select: {
          clientProperty: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
      _count: {
        select: {
          rfpProperties: true,
          rfpDocuments: true,
          rfpScopeOfWork: true,
        },
      },
    };

    const [data, pagination] = await this.prisma.client.rfps
      .paginate({
        where,
        orderBy,
        select,
      })
      .withPages(paginationInput);

    return {
      data,
      pagination,
    };
  }

  async findOne(id: string) {
    const rfp = await this.prisma.client.rfps.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        rfpName: true,
        description: true,
        status: true,
        rfpDueDate: true,
        createdAt: true,
        contractStartDate: true,
        termOfContract: true,
        rfiDate: true,
        rfqDate: true,
        rfpAwardDate: true,
        themeType: true,
        rfpExtendedDueDate: true,
        client: {
          select: {
            id: true,
            name: true,
            type: true,
            tenantId: true,
            logoUrl: true,
            themeHeaderImageUrl: true,
            description: true,
            legalName: true,
          },
        },
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
        clientId: true,
        serviceId: true,
        portfolioType: true,
        contractId: true,
        rfpProperties: {
          select: {
            id: true,
            rfpId: true,
            clientPropertyId: true,
            createdById: true,
            createdAt: true,
            clientProperty: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        rfpScopeOfWork: {
          select: {
            id: true,
            rfpId: true,
            scopeOfWorkId: true,
            createdById: true,
            createdAt: true,
          },
        },
        rfpDocuments: {
          select: {
            id: true,
            rfpId: true,
            fileName: true,
            filePath: true,
            fileType: true,
            fileSizeBytes: true,
            fileHash: true,
            createdById: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            rfpProperties: true,
            rfpDocuments: true,
            rfpScopeOfWork: true,
          },
        },
      },
    });
    if (!rfp) {
      throw new NotFoundException(`RFP not found`);
    }
    return rfp;
  }

  async update(id: string, updateRfpDto: UpdateRfpDto, user: RequestUser) {
    const {
      rfpName,
      description,
      clientId,
      serviceId,
      portfolioType,
      contractId,
      rfpDueDate,
      rfpAwardDate,
      rfqDate,
      rfiDate,
      contractStartDate,
      termOfContract,
      status,
      propertyIds,
      scopeOfWorkIds,
      documentsToAdd,
      documentsToRemove,
      themeType,
      rfpExtendedDueDate,
    } = updateRfpDto;

    if (rfpName) {
      // Check name is unique per client
      const existingRfp = await this.prisma.client.rfps.findFirst({
        where: {
          rfpName: {
            equals: rfpName,
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
          clientId,
          deletedAt: null,
        },
      });
      if (existingRfp) {
        throw new ConflictException('RFP name must be unique for this client');
      }
    }

    const updatedRfpResult = await this.prisma.client.$transaction(
      async (prisma) => {
        const rfp = await prisma.rfps.findUnique({
          where: { id, deletedAt: null },
        });
        if (!rfp) {
          throw new NotFoundException(`RFP not found`);
        }

        const data: Prisma.RfpsUpdateInput = {
          modifiedAt: new Date(),
          // updatedById: user.connexus_user_id,
          updatedBy: {
            connect: {
              id: user.connexus_user_id,
            },
          },
          ...(rfpName !== undefined && { rfpName }),
          ...(description !== undefined && { description }),
          ...(clientId !== undefined && {
            client: { connect: { id: clientId } },
          }),
          ...(serviceId !== undefined && {
            service: { connect: { id: serviceId } },
          }),
          ...(portfolioType !== undefined && { portfolioType }),
          ...(contractId !== undefined && {
            contract: { connect: { id: contractId } },
          }),
          ...(rfpDueDate !== undefined && { rfpDueDate }),
          ...(rfpAwardDate !== undefined && { rfpAwardDate }),
          ...(rfqDate !== undefined && { rfqDate }),
          ...(rfiDate !== undefined && { rfiDate }),
          ...(contractStartDate !== undefined && { contractStartDate }),
          ...(termOfContract !== undefined && { termOfContract }),
          ...(status !== undefined && { status }),
          ...(themeType !== undefined && { themeType }),
          ...(rfpExtendedDueDate !== undefined && { rfpExtendedDueDate }),
        };

        const updatedRfp = await prisma.rfps.update({
          where: { id },
          data,
        });

        if (propertyIds) {
          // Get existing property IDs for this RFP
          const existingProperties = await prisma.rfpProperties.findMany({
            where: { rfpId: id, deletedAt: null },
            select: { clientPropertyId: true },
          });

          const existingPropertyIds = existingProperties.map(
            (prop) => prop.clientPropertyId,
          );

          // Find property IDs to add (new ones)
          const propertyIdsToAdd = propertyIds.filter(
            (propId) => !existingPropertyIds.includes(propId),
          );

          // Find property IDs to remove (no longer needed)
          const propertyIdsToRemove = existingPropertyIds.filter(
            (propId) => !propertyIds.includes(propId),
          );

          // Remove property associations that are no longer needed
          if (propertyIdsToRemove.length > 0) {
            await prisma.rfpProperties.deleteMany({
              where: {
                rfpId: id,
                clientPropertyId: { in: propertyIdsToRemove },
              },
            });
          }

          // Add new property associations
          if (propertyIdsToAdd.length > 0) {
            await prisma.rfpProperties.createMany({
              data: propertyIdsToAdd.map((propertyId) => ({
                rfpId: id,
                clientPropertyId: propertyId,
                createdById: user.connexus_user_id,
              })),
            });
          }
        }

        if (scopeOfWorkIds) {
          // Get existing scope of work IDs for this RFP
          const existingScopeOfWork = await prisma.rfpScopeOfWork.findMany({
            where: { rfpId: id, deletedAt: null },
            select: { scopeOfWorkId: true },
          });

          const existingScopeOfWorkIds = existingScopeOfWork.map(
            (sow) => sow.scopeOfWorkId,
          );

          // Find scope of work IDs to add (new ones)
          const scopeOfWorkIdsToAdd = scopeOfWorkIds.filter(
            (sowId) => !existingScopeOfWorkIds.includes(sowId),
          );

          // Find scope of work IDs to remove (no longer needed)
          const scopeOfWorkIdsToRemove = existingScopeOfWorkIds.filter(
            (sowId) => !scopeOfWorkIds.includes(sowId),
          );

          // Remove scope of work associations that are no longer needed
          if (scopeOfWorkIdsToRemove.length > 0) {
            await prisma.rfpScopeOfWork.deleteMany({
              where: {
                rfpId: id,
                scopeOfWorkId: { in: scopeOfWorkIdsToRemove },
              },
            });
          }

          // Add new scope of work associations
          if (scopeOfWorkIdsToAdd.length > 0) {
            await prisma.rfpScopeOfWork.createMany({
              data: scopeOfWorkIdsToAdd.map((scopeOfWorkId) => ({
                rfpId: id,
                scopeOfWorkId,
                createdById: user.connexus_user_id,
              })),
            });
          }
        }

        // Handle documentsToRemove
        if (documentsToRemove && documentsToRemove.length > 0) {
          await prisma.rfpDocuments.deleteMany({
            where: {
              id: { in: documentsToRemove },
              rfpId: id,
            },
          });
        }

        // Handle documentsToAdd
        if (documentsToAdd && documentsToAdd.length > 0) {
          // Check duplicates by hash within this RFP before adding
          const hashes = documentsToAdd
            .map((d) => (d as any).fileHash)
            .filter(Boolean) as string[];
          if (hashes.length > 0) {
            const existing = await prisma.rfpDocuments.findMany({
              where: {
                rfpId: id,
                fileHash: { in: hashes },
                deletedAt: null,
              },
              select: { id: true, fileHash: true },
            });
            if (existing.length > 0) {
              throw new ConflictException(
                'Duplicate RFP document(s) with same hash exist',
              );
            }
          }

          await prisma.rfpDocuments.createMany({
            data: documentsToAdd.map((doc) => ({
              rfpId: id,
              fileName: doc.fileName,
              filePath: doc.filePath,
              fileType: doc.fileType,
              fileSizeBytes: doc.fileSizeBytes,
              fileHash: (doc as any).fileHash,
              createdById: user.connexus_user_id,
            })),
          });
        }

        return updatedRfp;
      },
    );

    return this.findOne(updatedRfpResult.id);
  }

  async remove(id: string, user: RequestUser) {
    const rfp = await this.prisma.client.rfps.findUnique({
      where: { id, deletedAt: null },
    });

    if (!rfp) {
      throw new NotFoundException(`RFP not found`);
    }

    return this.prisma.client.rfps.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: user.connexus_user_id,
      },
    });
  }

  /**
   * Get all properties associated with a given RFP ID with filters
   */
  async getRfpProperties(query: GetRfpPropertiesDto) {
    const {
      rfpId,
      search,
      status,
      type,
      cityIds,
      stateIds,
      countryIds,
      countyIds,
      managerIds = [],
      managerEmailIds = [],
      propertyAddress,
      clientId,
      tenantId,
      excludeIds,
      propertiesId,
      serviceIds,
      isRetailScope,
      isRetail,
      sort,
      sortDirection,
      page,
      limit,
    } = query;

    // Ensure the RFP exists
    const rfp = await this.prisma.client.rfps.findUnique({
      where: { id: rfpId, deletedAt: null },
      select: { id: true },
    });
    if (!rfp) {
      throw new NotFoundException(`RFP not found`);
    }

    const combinedManagerIds = [...managerIds, ...managerEmailIds];

    const filters: Prisma.ClientPropertiesWhereInput = {
      ...(cityIds && cityIds.length > 0 && { cityId: { in: cityIds } }),
      ...(stateIds && stateIds.length > 0 && { stateId: { in: stateIds } }),
      ...(propertiesId &&
        propertiesId.length > 0 && { id: { in: propertiesId } }),
      ...(countryIds &&
        countryIds.length > 0 && { countryId: { in: countryIds } }),
      ...(combinedManagerIds &&
        combinedManagerIds.length > 0 && {
          propertyManagerId: { in: combinedManagerIds },
        }),
      ...(propertyAddress && {
        address: { contains: propertyAddress, mode: 'insensitive' },
      }),
      ...(countyIds && countyIds.length > 0 && { countyId: { in: countyIds } }),
      ...(clientId && { clientId }),
      ...(tenantId && { tenantId }),
      ...(excludeIds && excludeIds.length > 0 && { id: { notIn: excludeIds } }),
      ...(status && status.length > 0 && { status: { in: status } }),
      ...(type && type.length > 0 && { type: { in: type } }),
      ...(isRetailScope !== undefined && { isRetailScope }),
      ...(isRetail !== undefined && { isRetail }),
      deletedAt: null,
    };

    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { zip: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (serviceIds && serviceIds.length > 0) {
      filters.propertyServiceMap = {
        some: {
          serviceId: { in: serviceIds },
        },
      };
    }

    // Add RFP property filter
    filters.rfpProperties = {
      some: {
        rfpId,
        deletedAt: null,
      },
    };

    const orderBy = getSortInput({
      sort,
      sortDirection,
      modelName: Prisma.ModelName.ClientProperties,
      defaultSort: 'createdAt',
    });

    const paginationInput = getPaginationInput({ page, limit });

    const [data, pagination] = await this.prisma.client.clientProperties
      .paginate({
        where: filters,
        orderBy,
        select: {
          id: true,
          name: true,
          address: true,
          zip: true,
          tenantId: true,
          clientId: true,
          client: { select: { id: true, name: true } },
          state: {
            select: { id: true, stateName: true, isDeleted: true },
          },
          city: { select: { id: true, cityName: true } },
          country: { select: { id: true, countryName: true } },
          county: { select: { id: true, name: true } },
          status: true,
          unitCount: true,
          buildingCount: true,
          acres: true,
          isRetail: true,
          latitude: true,
          longitude: true,
          propertyManager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          propertyServiceMap: {
            select: {
              service: { select: { id: true, servicesName: true } },
            },
          },
          _count: {
            select: {
              rfpPropertyAttachments: {
                where: {
                  rfpId,
                },
              },
            },
          },
        },
      })
      .withPages(paginationInput);

    return { data, pagination };
  }

  async getRfpScopeOfWork(query: GetRfpScopeOfWorkDto & { rfpId: string }) {
    const {
      rfpId,
      page = 1,
      limit = 10,
      sort = 'createdAt',
      sortDirection = 'desc',
      search,
      scopeOfWorkStatus,
      scopeOfWorkType,
      serviceId,
      propertyIds,
      propertyStatus,
      propertyType,
      cityIds,
      stateIds,
      countryIds,
      propertyLimitPerRecord = 3,
    } = query;

    // Validate RFP exists
    const rfp = await this.prisma.client.rfps.findUnique({
      where: { id: rfpId, deletedAt: null },
      select: { id: true },
    });
    if (!rfp) throw new NotFoundException('RFP not found');

    // Build SOW filters
    const sowWhere: Prisma.ScopeOfWorkWhereInput = {
      rfpScopeOfWork: {
        some: { rfpId, deletedAt: null },
      },
      deletedAt: null,
      ...(search && {
        OR: [
          { scopeName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(scopeOfWorkStatus &&
        scopeOfWorkStatus.length > 0 && {
          scopeOfWorkStatus: { in: scopeOfWorkStatus },
        }),
      ...(scopeOfWorkType &&
        scopeOfWorkType.length > 0 && {
          scopeType: { in: scopeOfWorkType },
        }),
      ...(serviceId && { serviceId }),
    };

    // Build property filters for SOWs
    if (
      (propertyIds && propertyIds.length > 0) ||
      (propertyStatus && propertyStatus.length > 0) ||
      (propertyType && propertyType.length > 0) ||
      (cityIds && cityIds.length > 0) ||
      (stateIds && stateIds.length > 0) ||
      (countryIds && countryIds.length > 0)
    ) {
      const propertyFilter: Prisma.ClientPropertiesWhereInput = {
        deletedAt: null,
        ...(propertyIds && propertyIds.length > 0
          ? { id: { in: propertyIds } }
          : {}),
        ...(propertyStatus && propertyStatus.length > 0
          ? { status: { in: propertyStatus.map((s) => s as PropertyStatuses) } }
          : {}),
        ...(propertyType && propertyType.length > 0
          ? {
              type: { in: propertyType.map((t) => t as PropertyBuildingTypes) },
            }
          : {}),
        ...(cityIds && cityIds.length > 0 ? { cityId: { in: cityIds } } : {}),
        ...(stateIds && stateIds.length > 0
          ? { stateId: { in: stateIds } }
          : {}),
        ...(countryIds && countryIds.length > 0
          ? { countryId: { in: countryIds } }
          : {}),
      };
      sowWhere.scopeOfWorkProperty = {
        some: {
          property: propertyFilter,
        },
      };
    }

    const orderBy = getSortInput({
      sort,
      sortDirection,
      modelName: 'ScopeOfWork',
      defaultSort: 'createdAt',
    });
    const paginationInput = getPaginationInput({ page, limit });

    const [data, pagination] = await this.prisma.client.scopeOfWork
      .paginate({
        where: sowWhere,
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
            take: propertyIds ? undefined : propertyLimitPerRecord,
            where: propertyIds
              ? {
                  property: {
                    id: { in: propertyIds },
                  },
                }
              : undefined,
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
              scopeOfWorkPropertyVersion: {
                where: { scopeOfWorkVersion: { isCurrent: true } },
                select: {
                  id: true,
                  scopeOfWorkVersion: {
                    select: {
                      id: true,
                      scopeOfWorkId: true,
                      versionNumber: true,
                      fileName: true,
                      sourceFileUrl: true,
                      createdAt: true,
                      content: true,
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
                    },
                  },
                },
              },
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

    return { data, pagination };
  }

  async getAllRfpProperties(rfpId: string) {
    const rfp = await this.prisma.client.rfps.findUnique({
      where: { id: rfpId, deletedAt: null },
      select: { id: true },
    });
    if (!rfp) throw new NotFoundException('RFP not found');

    const rfpProperties = await this.prisma.client.rfpProperties.findMany({
      where: { rfpId, deletedAt: null },
      select: {
        clientProperty: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return rfpProperties;
  }

  async generateRfpTemplate(input: GetRfpTemplateDto, user: RequestUser) {
    try {
      const response = await this.prisma.client.$transaction(async (tx) => {
        // Get RFP with all necessary relations in a single query
        const rfpTemplate = await tx.rfps.findUnique({
          where: {
            id: input.rfpId,
            deletedAt: null,
          },
          include: {
            client: { select: { id: true, modifiedAt: true } },
            service: { select: { id: true, modifiedAt: true } },
            rfpProperties: {
              take: 1,
              orderBy: {
                clientProperty: { modifiedAt: 'desc' },
              },
              include: {
                clientProperty: { select: { id: true, modifiedAt: true } },
              },
            },
          },
        });

        if (!rfpTemplate) {
          throw new NotFoundException(`RFP with ID not found`);
        }

        // Only check for pending tasks
        const pendingTask = await tx.templateGenerationTasks.findFirst({
          where: {
            rfpId: rfpTemplate.id,
            type: TemplateGenerationTypes.RFP,
            fileType: input.fileType,
            status: TemplateGenerationStatuses.PENDING,
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
            rfpId: true,
            rfp: {
              select: {
                id: true,
                rfpName: true,
                clientId: true,
              },
            },
          },
        });

        // If pending task exists, return it
        if (pendingTask) {
          return {
            message: 'Template generation already in progress',
            templateGenerationTask: pendingTask,
          };
        }

        // Create new template generation task
        const templateGenerationTask = await tx.templateGenerationTasks.create({
          data: {
            rfpId: rfpTemplate.id,
            status: TemplateGenerationStatuses.PENDING,
            createdById: user.connexus_user_id,
            updatedById: user.connexus_user_id,
            type: TemplateGenerationTypes.RFP,
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
            rfpId: true,
            rfp: {
              select: {
                id: true,
                rfpName: true,
                clientId: true,
              },
            },
          },
        });

        const templateGenerationInput: GenerateRfpDocTemplateInput = {
          jobType: 'GENERATE_RFP_DOCX_TEMPLATE',
          input: {
            taskId: templateGenerationTask.id,
          },
        };

        if (input.fileType === 'PDF') {
          templateGenerationInput.jobType = 'GENERATE_RFP_PDF_TEMPLATE';
        }

        await this.sqsService.generateRfpTemplate(templateGenerationInput);

        return {
          message: 'Template generation started',
          templateGenerationTask,
        };
      });
      return response;
    } catch (error) {
      this.logger.error('Error generating RFP template:', error);
      throw error;
    }
  }

  /**
   * Get potential vendors for a specific RFP and property
   */
  async getPotentialVendors(
    rfpId: string,
    propertyId: string,
    query: GetPotentialVendorsDto,
  ) {
    // Input validation
    if (!rfpId || typeof rfpId !== 'string') {
      this.logger.warn(`Invalid RFP ID provided: ${rfpId}`);
      throw new BadRequestException('Invalid RFP ID');
    }

    if (!propertyId || typeof propertyId !== 'string') {
      this.logger.warn(`Invalid property ID provided: ${propertyId}`);
      throw new BadRequestException('Invalid property ID');
    }

    // 1. Validate RFP exists
    const rfp = await this.prisma.client.rfps.findUnique({
      where: { id: rfpId, deletedAt: null },
      select: { id: true, serviceId: true },
    });
    if (!rfp) {
      this.logger.warn(`RFP not found: ${rfpId}`);
      throw new NotFoundException('RFP not found');
    }

    // 2. Validate property exists
    const property = await this.prisma.client.clientProperties.findUnique({
      where: { id: propertyId, deletedAt: null },
      select: {
        id: true,
        stateId: true,
        cityId: true,
        countyId: true,
      },
    });
    if (!property) {
      this.logger.warn(`Property not found: ${propertyId}`);
      throw new NotFoundException('Property not found');
    }

    // 3. Validate property is associated with the RFP
    const rfpProperty = await this.prisma.client.rfpProperties.findFirst({
      where: {
        rfpId,
        clientPropertyId: propertyId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!rfpProperty) {
      this.logger.warn(
        `Property ${propertyId} is not associated with RFP ${rfpId}`,
      );
      throw new BadRequestException('Property is not associated with this RFP');
    }

    // 4. Validate property has geographical location data
    if (!property.stateId) {
      this.logger.warn(
        `Property ${propertyId} has no geographic location data`,
      );
      throw new BadRequestException(
        'Property must have geographical location data (state) to find potential vendors',
      );
    }

    // 5. Build vendor filters for properties with location data
    const baseVendorWhere = buildBaseVendorWhere(query);
    const geographicFilter = buildGeographicFilter({
      stateId: property.stateId,
      cityId: property.cityId,
      countyId: property.countyId,
    });

    // 6. Combine filters
    const vendorWhere: Prisma.VendorsWhereInput = {
      ...baseVendorWhere,
      ...geographicFilter,
      // Only vendors that provide the same service as the RFP
      vendorServices: {
        some: {
          serviceId: rfp.serviceId,
        },
      },
    };

    // 7. Get pagination input
    const paginationInput = getPaginationInput({
      page: query.page,
      limit: query.limit,
    });

    // 8. Get sorting input
    const orderBy = getSortInput({
      sort: query.sort,
      sortDirection: query.sortDirection,
      defaultSort: 'name',
      modelName: Prisma.ModelName.Vendors,
    });

    // 9. Execute query with pagination
    const [vendors, pagination] = await this.prisma.client.vendors
      .paginate({
        where: vendorWhere,
        orderBy,
        select: {
          id: true,
          name: true,
          logo: true,
          status: true,
          address: true,
          vendorWebsite: true,
          vendorServiceCoverContinentalUs: true,
          vendorInterestedReceiveRfpOutside: true,
          city: {
            select: {
              id: true,
              cityName: true,
            },
          },
          state: {
            select: {
              id: true,
              stateName: true,
            },
          },
          country: {
            select: {
              id: true,
              countryName: true,
            },
          },
          parentCompany: {
            select: {
              id: true,
              name: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              parentTenant: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          vendorServices: {
            where: {
              serviceId: rfp.serviceId,
            },
            select: {
              vendorServiceType: true,
              service: {
                select: {
                  id: true,
                  servicesName: true,
                },
              },
            },
            take: 1,
          },
          vendorServicableAreas: {
            select: {
              id: true,
              stateId: true,
              cityId: true,
              countyId: true,
            },
          },
        },
      })
      .withPages(paginationInput);

    // 10. Add match types to raw vendor data
    const vendorsWithMatchType = vendors.map((vendor) => {
      const { matchType, matchingServiceableArea } = determineVendorMatch(
        vendor,
        {
          stateId: property.stateId,
          cityId: property.cityId,
          countyId: property.countyId,
        },
      );

      return {
        ...vendor,
        matchType,
        matchingServiceableArea,
      };
    });

    return {
      data: vendorsWithMatchType,
      pagination,
    };
  }
}
