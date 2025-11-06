import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ExportSqsListenerService } from './export-sqs-listener.service';

describe('ExportSqsListenerService', () => {
  let service: ExportSqsListenerService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportSqsListenerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'EXPORT_QUEUE_URL':
                  return 'https://sqs.us-east-1.amazonaws.com/test/export-queue';
                case 'AWS_REGION':
                  return 'us-east-1';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ExportSqsListenerService>(ExportSqsListenerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle export message successfully', async () => {
    const mockMessage = {
      Body: JSON.stringify({
        exportType: 'csv',
        data: { userId: '123' },
      }),
    };

    const result = await service.handleExportMessage(mockMessage);
    expect(result).toBe(true);
  });

  it('should handle invalid message body', async () => {
    const mockMessage = {
      Body: 'invalid json',
    };

    const result = await service.handleExportMessage(mockMessage);
    expect(result).toBe(false);
  });
});
