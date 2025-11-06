import { PrismaService as PrismaClientService } from '@app/prisma';
import { GptService } from '@app/shared/gpt'; // adjust path as needed
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ScopeOfWorkTypes } from '@prisma/client';
import { GenerateScopeOfWorkDto, ModifyScopeOfWorkGptDto } from './dto';

@Injectable()
export class SowGptService {
  private readonly logger = new Logger(SowGptService.name);

  constructor(
    private readonly gptService: GptService,
    private readonly prisma: PrismaClientService,
  ) {}

  async generateScopeOfWorkGpt(dto: GenerateScopeOfWorkDto) {
    const { serviceId, sowName, propertyIds, clientId } = dto;

    try {
      const client = await this.prisma.client.client.findUnique({
        where: {
          id: clientId,
        },
      });
      if (!client) {
        throw new NotFoundException('Client not found');
      }
      await this.ensureUniqueScopeName(sowName, clientId);

      const service = await this.prisma.client.services.findUnique({
        where: {
          id: serviceId,
        },
      });

      if (!service) {
        throw new NotFoundException('Service not found');
      }

      const properties = await this.prisma.client.clientProperties.findMany({
        where: {
          id: { in: propertyIds },
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          status: true,
          client: {
            select: {
              id: true,
              name: true,
              legalName: true,
              type: true,
            },
          },
        },
      });

      if (properties.length === 0) {
        throw new NotFoundException('Properties not found');
      }

      const response = await this.gptService.generateSowMarkdown({
        serviceName: service.servicesName,
        serviceDescription: service.serviceDescription,
        sowName,
        propertyIds,
        clientName: client.name,
      });

      return {
        markdown: response.markdown,
        comments: response.comments,
        bottomComment: response.bottomComment,
        metadata: {
          ...response.metadata,
          clientName: client.name,
          service: {
            id: service.id,
            name: service.servicesName,
            description: service.serviceDescription,
          },
          properties: properties.map(({ id, name }) => ({
            id,
            name,
          })),
        },
      };
    } catch (err) {
      this.logger.error('Failed to generate SOW', err);
      throw new BadRequestException(err || 'SOW generation failed');
    }
  }

  async modifyScopeOfWork(dto: ModifyScopeOfWorkGptDto) {
    const { markdown, message } = dto;

    try {
      const response = await this.gptService.modifySowMarkdown({
        markdown,
        message,
      });

      return {
        markdown: response.markdown,
        wasModified: response.wasModified,
        comments: response.comments,
        bottomComment: response.bottomComment,
      };
    } catch (err) {
      this.logger.error('Failed to reshape SOW', err);
      throw new BadRequestException(err || 'SOW reshaping failed');
    }
  }

  private async ensureUniqueScopeName(scopeName: string, clientId: string) {
    const existingScope = await this.prisma.client.scopeOfWork.findFirst({
      where: {
        scopeName: { equals: scopeName, mode: 'insensitive' },
        deletedAt: null,
        scopeType: ScopeOfWorkTypes.CLIENT_SCOPE_OF_WORK,
        clientId,
      },
    });
    if (existingScope) {
      throw new BadRequestException(
        'Client scope of work name must be unique for this client',
      );
    }
  }
}
