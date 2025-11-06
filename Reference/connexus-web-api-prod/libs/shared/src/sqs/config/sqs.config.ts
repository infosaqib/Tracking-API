import { registerAs } from '@nestjs/config';

export default registerAs('sqs', () => ({
  contractQueueId: process.env.CONTRACT_QUEUE,
  contractExtractionQueueId: process.env.EXTRACTION_QUEUE,
  contractSowQueueId: process.env.SCOPE_OF_WORK_QUEUE,
  exportQueueId: process.env.EXPORT_QUEUE,
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
}));
