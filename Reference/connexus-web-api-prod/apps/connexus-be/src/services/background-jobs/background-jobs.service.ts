import { caslSubjects, getAbilityFilters } from '@app/ability';
import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput, getSortInput, RequestUser } from '@app/shared';
import { SqsService } from '@app/shared/sqs';
import {
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { BackgroundJobStatuses, JobTypes, Prisma } from '@prisma/client';
import { StorageService } from 'src/services/storage/storage.service';
import { formatDate } from 'src/utils/date-helpers';
import {
  generateBackgroundJobsPDF,
  generateCSV,
  generateExcel,
} from 'src/utils/file-export-utils';
import { ClientsService } from '../clients/clients.service';
import { ExportFormat } from '../contracts/dto/export-format-type';
import { PermissionType } from '../permissions/dto/permissions.entity';
import { CreateBackgroundJobDto } from './dto/create-background-job.dto';
import { ExportBackgroundJobsDto } from './dto/export-background-jobs.dto';
import { GetJobsDto } from './dto/get-jobs.dto';
import { GetUploadedUserDto } from './dto/get-uploaded-user.dto';
import { UpdateBackgroundJobDto } from './dto/update-background-job.dto';

@Injectable()
export class BackgroundJobsService {
  constructor(
    private readonly prismaClient: PrismaClientService,
    private readonly sqsService: SqsService,
    private readonly storageService: StorageService,
    private readonly clientsService: ClientsService,
  ) {}

  prisma = this.prismaClient.client;

  /**
   * Build allowed tenant IDs based on user permissions and workspace
   */
  private async buildAllowedTenantIds(
    query: GetJobsDto,
    user: RequestUser,
  ): Promise<string[]> {
    const userWorkspace = await this.clientsService.getWorkSpaces(user);

    let allowedTenantIds: string[] = [];

    if (user.user_type === PermissionType.connexus) {
      allowedTenantIds = query.tenantIds || [];
    } else if (userWorkspace) {
      allowedTenantIds = [userWorkspace.tenantId];

      if (
        userWorkspace.tenant.childTenants &&
        userWorkspace.tenant.childTenants.length > 0
      ) {
        const childTenantIds = userWorkspace.tenant.childTenants.map(
          (child) => child.id,
        );
        allowedTenantIds.push(...childTenantIds);
      }

      if (query.tenantIds && query.tenantIds.length > 0) {
        allowedTenantIds = query.tenantIds.filter((id) =>
          allowedTenantIds.includes(id),
        );
      }
    } else {
      allowedTenantIds = [user.tenant_id];
    }

    return allowedTenantIds;
  }

  /**
   * Build where clause for background jobs queries
   */
  private buildWhereClause(
    query: GetJobsDto,
    user: RequestUser,
    allowedTenantIds: string[],
  ): Prisma.BackgroundJobsWhereInput {
    return {
      ...{ deletedAt: null },
      ...(user.user_type === PermissionType.connexus
        ? query.tenantIds &&
          query.tenantIds.length > 0 && { tenantId: { in: query.tenantIds } }
        : allowedTenantIds.length > 0 && {
            tenantId: { in: allowedTenantIds },
          }),

      ...(query.status && { status: { in: query.status } }),
      ...(query.uploadedBy && {
        createdById: { in: query.uploadedBy },
      }),
      ...(query.createdAt && {
        createdAt: {
          gte: new Date(new Date(query.createdAt)),
          lte: new Date(
            new Date(query.createdAt).getTime() + 24 * 60 * 60 * 1000,
          ),
        },
      }),
      ...(query.jobTypes &&
        query.jobTypes.length > 0 && {
          jobType: {
            in: query.jobTypes,
          },
        }),
      ...(query.search && {
        fileDetail: {
          fileName: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      }),
      NOT: {
        jobType: 'ZIP_EXTRACTION_PROCESSING',
        status: 'COMPLETED',
      },
    };
  }

  /**
   * Get select fields for background jobs queries
   */
  private getBackgroundJobsSelect() {
    return {
      id: true,
      status: true,
      jobType: true,
      resultId: true,
      createdAt: true,
      response: true,
      failureReason: true,
      parentId: true,
      fileDetail: {
        select: {
          filePath: true,
          fileName: true,
          fileHash: true,
        },
      },
      tenant: {
        select: {
          id: true,
          client: {
            select: {
              id: true,
              name: true,
              legalName: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    };
  }

  /**
   * Transform background jobs data for export
   */
  private transformDataForExport(data: any[]) {
    return data.map((job) => ({
      'Client Name': job.tenant.client.legalName,
      'Bulk Upload File': job.parentId ? 'YES' : 'N/A',
      'File Name':
        job.fileDetail?.fileName ||
        (job.response ? job.response.split('___').pop() : 'N/A'),
      'Uploaded By': `${job.createdBy.firstName} ${job.createdBy.lastName}`,
      'Uploaded Date': formatDate(job.createdAt),
      Status: job.status?.replace(/_/g, ' '),
      'Failure Reason': job.failureReason || 'N/A',
    }));
  }

  async create(
    createBackgroundJobDto: CreateBackgroundJobDto,
    user: RequestUser,
  ) {
    let fileId = null;
    if (
      createBackgroundJobDto.jobType === JobTypes.AI_CONTRACT_PROCESSING ||
      createBackgroundJobDto.jobType === JobTypes.ZIP_EXTRACTION_PROCESSING
    ) {
      if (createBackgroundJobDto.response) {
        const fileDetails = await this.prisma.fileDetails.create({
          data: {
            filePath: createBackgroundJobDto.response,
            fileHash: createBackgroundJobDto.fileHash,
            fileName:
              createBackgroundJobDto.fileName ||
              createBackgroundJobDto.response.split('___').pop(),
          },
        });
        fileId = fileDetails.id;
      }
    }
    const job = await this.prisma.backgroundJobs.create({
      data: {
        jobType: createBackgroundJobDto.jobType,
        response: createBackgroundJobDto.response,
        fileId,
        createdById: user.connexus_user_id,
        modifiedById: user.connexus_user_id,
        tenantId: createBackgroundJobDto.tenantId,
      },
      include: {
        fileDetail: true,
      },
    });

    if (job.jobType === JobTypes.AI_CONTRACT_PROCESSING) {
      const client = await this.prisma.client.findFirst({
        where: { tenantId: job.tenantId },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${job.tenantId} not found`);
      }

      await this.sqsService.sendMessage({
        jobType: 'AI_CONTRACT_PROCESSING',
        input: {
          filePath: job.response,
          clientId: client.id,
          jobId: job.id,
          createdById: job.createdById,
        },
      });
    } else if (job.jobType === JobTypes.ZIP_EXTRACTION_PROCESSING) {
      const client = await this.prisma.client.findFirst({
        where: { tenantId: job.tenantId },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${job.tenantId} not found`);
      }

      await this.sqsService.sendZipSQSMessage({
        jobType: 'ZIP_EXTRACTION_PROCESSING',
        input: {
          filePath: job.response,
          clientId: client.id,
          jobId: job.id,
          createdById: job.createdById,
          tenantId: job.tenantId,
        },
      });
    }

    return job;
  }

  async findAll(query: GetJobsDto, user: RequestUser) {
    const allowedTenantIds = await this.buildAllowedTenantIds(query, user);
    const where = this.buildWhereClause(query, user, allowedTenantIds);

    const [data, pagination] = await this.prisma.backgroundJobs
      .paginate({
        where,
        orderBy: getSortInput({
          sort: query.sort,
          sortDirection: query.sortDirection,
          modelName: Prisma.ModelName.BackgroundJobs,
          defaultSort: 'createdAt',
        }),
        select: this.getBackgroundJobsSelect(),
      })
      .withPages(getPaginationInput({ page: query.page, limit: query.limit }));

    return { data, pagination };
  }

  async exportBackgroundJobs({
    query,
    user,
  }: {
    query: ExportBackgroundJobsDto;
    user: RequestUser;
  }): Promise<Buffer> {
    const allowedTenantIds = await this.buildAllowedTenantIds(query, user);
    const where = this.buildWhereClause(query, user, allowedTenantIds);

    const data = await this.prisma.backgroundJobs.findMany({
      where,
      orderBy: getSortInput({
        sort: query.sort,
        sortDirection: query.sortDirection,
        modelName: Prisma.ModelName.BackgroundJobs,
        defaultSort: 'createdAt',
      }),
      select: this.getBackgroundJobsSelect(),
    });

    if (data.length === 0) {
      throw new NotFoundException('No data available to export');
    }

    const transformedData = this.transformDataForExport(data);
    const format = query.format || ExportFormat.XLSX;

    switch (format) {
      case ExportFormat.CSV:
        return generateCSV(transformedData);
      case ExportFormat.PDF:
        return generateBackgroundJobsPDF(transformedData);
      default:
        return generateExcel(transformedData);
    }
  }

  async checkFileExists(fileHash: string, tenantId: string) {
    const existingFile = await this.prisma.fileDetails.findFirst({
      where: {
        fileHash,
        BackgroundJobs: {
          some: {
            tenantId,
          },
        },
        deletedAt: null,
      },
      include: {
        BackgroundJobs: {
          where: {
            tenantId,
          },
        },
      },
    });

    return existingFile || null;
  }

  async findOne(id: string) {
    const job = await this.prisma.backgroundJobs.findUnique({
      where: { id, deletedAt: null },
      select: {
        response: true,
        resultId: true,
        fileDetail: {
          select: {
            filePath: true,
            fileName: true,
            fileHash: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        id: true,
        jobType: true,
        status: true,
        createdAt: true,
        modifiedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        modifiedAt: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Background job with ID ${id} not found`);
    }

    return job;
  }

  async update(
    id: string,
    updateBackgroundJobDto: UpdateBackgroundJobDto,
    user: RequestUser,
  ) {
    await this.findOne(id);

    return this.prisma.backgroundJobs.update({
      where: { id },
      data: {
        ...updateBackgroundJobDto,
        modifiedById: user.connexus_user_id,
      },
    });
  }

  async remove(id: string, user: RequestUser) {
    const backgroundjob = await this.prisma.backgroundJobs.findUnique({
      where: { id, deletedAt: null },
      select: {
        resultId: true,
        status: true,
        createdById: true,
        parentId: true,
        tenantId: true,
        fileDetail: {
          select: { id: true, filePath: true },
        },
      },
    });

    if (!backgroundjob) {
      throw new NotFoundException(`Background job with ID ${id} not found`);
    }

    if (backgroundjob.status === BackgroundJobStatuses.COMPLETED) {
      throw new MethodNotAllowedException(
        `Cannot delete a completed background job`,
      );
    }
    if (backgroundjob.status === BackgroundJobStatuses.PENDING) {
      throw new MethodNotAllowedException(
        `Cannot delete a pending background job`,
      );
    }

    if (
      user.user_type !== PermissionType.connexus &&
      // user.connexus_user_id !== backgroundjob.createdById ||
      user.tenant_id !== backgroundjob.tenantId
    ) {
      throw new MethodNotAllowedException(
        `You are not allowed to delete this background job`,
      );
    }

    // ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
    //   Actions.Delete,
    //   createSubject(caslSubjects.BackgroundJobs, backgroundjob),
    // );

    await this.prisma.$transaction(async (prisma) => {
      if (backgroundjob.fileDetail) {
        await this.storageService.deleteFile(backgroundjob.fileDetail.filePath);

        await prisma.fileDetails.update({
          where: { id: backgroundjob.fileDetail.id },
          data: {
            deletedAt: new Date(),
            filePath: '',
          },
        });
      }
      if (backgroundjob.parentId) {
        const updatedJob = await prisma.backgroundJobs.update({
          where: { id: backgroundjob.parentId },
          data: {
            deletedAt: new Date(),
            modifiedById: user?.connexus_user_id,
          },
          include: {
            fileDetail: {
              select: { id: true, filePath: true },
            },
          },
        });
        if (updatedJob.fileDetail) {
          if (updatedJob.fileDetail.filePath)
            await this.storageService.deleteFile(
              updatedJob.fileDetail.filePath,
            );
          await prisma.fileDetails.update({
            where: { id: updatedJob.fileDetail.id },
            data: {
              deletedAt: new Date(),
              filePath: '',
            },
          });
        }
      }
      await prisma.backgroundJobs.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          modifiedById: user?.connexus_user_id,
        },
      });
    });

    return { message: `Background job has been removed` };
  }

  async findUploadedUser(getUserDto: GetUploadedUserDto, user: RequestUser) {
    const { limit, page } = getUserDto;

    const filters: Prisma.UsersWhereInput = {
      deletedAt: null,
      userTenants: {},
      authorized: true,
    };

    if (getUserDto.search) {
      filters.OR = [
        {
          fullName: {
            contains: getUserDto.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          firstName: {
            contains: getUserDto.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          lastName: {
            contains: getUserDto.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ];
    }

    const orderBy = getSortInput({
      sort: getUserDto.sort,
      sortDirection: getUserDto.sortDirection,
      modelName: Prisma.ModelName.Users,
      defaultSort: 'createdAt',
    });

    const [data, pagination] = await this.prisma.users
      .paginate({
        where: getAbilityFilters({
          user,
          condition: filters,
          subject: caslSubjects.Contract,
        }),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          authorized: true,
          title: true,
        },
        orderBy,
      })
      .withPages(getPaginationInput({ page, limit }));

    return {
      data,
      pagination,
    };
  }
}
