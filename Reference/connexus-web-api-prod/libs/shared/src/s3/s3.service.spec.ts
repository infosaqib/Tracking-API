import { S3Config, S3Service, UploadFileInput } from './s3.service';

describe('S3Service', () => {
  const config: S3Config = {
    region: 'us-east-1',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    bucket: 'test-bucket',
  };

  let service: S3Service;

  beforeEach(() => {
    service = new S3Service(config);
    // @ts-ignore
    service.s3Client.send = jest.fn().mockResolvedValue({});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload a file and return the correct url', async () => {
    const input: UploadFileInput = {
      key: 'test.txt',
      body: 'test-content',
      contentType: 'text/plain',
    };
    const output = await service.uploadFile(input);
    expect(output.url).toBe(
      'https://test-bucket.s3.us-east-1.amazonaws.com/test.txt',
    );
  });
});
