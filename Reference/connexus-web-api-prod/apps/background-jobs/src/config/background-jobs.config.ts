import { registerAs } from '@nestjs/config';

export default registerAs('backgroundJobs', () => {
  const config = {
    exportQueueUrl: process.env.EXPORT_QUEUE_URL || '',
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  };

  return config;
});
