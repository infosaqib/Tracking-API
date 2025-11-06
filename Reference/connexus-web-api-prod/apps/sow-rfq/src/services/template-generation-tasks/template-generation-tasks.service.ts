import { PrismaService } from '@app/prisma';
import { RequestUser } from '@app/shared';
import { SqsService } from '@app/shared/sqs';
import { GenerateSowDocTemplateInput } from '@app/shared/sqs/types/contract-upload-input';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TemplateGenerationStatuses } from '@prisma/client';

@Injectable()
export class TemplateGenerationTasksService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sqsService: SqsService,
  ) {}

  client = this.prismaService.client;

  async getTemplateGenerationTask(id: string) {
    return this.client.templateGenerationTasks.findFirstOrThrow({
      where: {
        id,
      },
    });
  }

  async retryFailedTask(id: string, user: RequestUser) {
    // Find the task and validate it exists and is failed
    const task = await this.client.templateGenerationTasks.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(
        `Template generation task with ID ${id} not found`,
      );
    }

    if (task.status !== TemplateGenerationStatuses.FAILED) {
      throw new BadRequestException(
        `Cannot retry task with status ${task.status}. Only failed tasks can be retried.`,
      );
    }

    // Update task status to PENDING
    const updatedTask = await this.client.templateGenerationTasks.update({
      where: { id },
      data: {
        status: TemplateGenerationStatuses.PENDING,
        updatedById: user.connexus_user_id,
      },
      include: {
        scopeOfWork: {
          select: {
            id: true,
            scopeName: true,
            clientId: true,
          },
        },
      },
    });

    // Send task to SQS for processing
    const templateGenerationInput: GenerateSowDocTemplateInput = {
      jobType: 'GENERATE_SOW_DOCX_TEMPLATE',
      input: {
        taskId: task.id,
      },
    };

    await this.sqsService.generateSowTemplate(templateGenerationInput);

    return {
      message: 'Task retry initiated successfully',
      templateGenerationTask: updatedTask,
    };
  }
}
