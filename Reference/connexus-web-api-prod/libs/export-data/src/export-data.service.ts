import { PrismaService } from '@app/prisma';
import { SqsService } from '@app/shared/sqs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExportDataDto } from './dto';

@Injectable()
export class ExportDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sqsService: SqsService,
  ) {}

  async findOne(id: string) {
    const exportData = await this.prisma.client.exportBackgroundJobs.findUnique(
      {
        where: { id },
      },
    );
    if (!exportData) {
      throw new NotFoundException('Export data not found');
    }
    return exportData;
  }

  async create(data: CreateExportDataDto) {
    const exportJob = await this.prisma.client.exportBackgroundJobs.create({
      data: {
        createdById: data.createdById,
        fileType: data.fileType,
        type: `${data.type}`,
      },
    });

    // Send message to export queue
    await this.sqsService.sendExportSQSMessage({
      message: 'TABLE_EXPORT',
      data: {
        fileType: data.fileType,
        type: data.type,
        exportId: exportJob.id,
        userId: data.createdById,
        filters: data.filters || {},
        sort: data.sort || {},
      },
    });

    return exportJob;
  }
}
