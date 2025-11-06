import * as dotenv from 'dotenv';

dotenv.config();

export const envValues = {
  mode: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  auth: {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
    region: process.env.AWS_REGION,
    clientSecret: process.env.COGNITO_CLIENT_SECRET,
    jwtSecret: process.env.AUTH_JWT_SECRET,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  // sqs: {
  //   queueUrl: process.env.SQS_QUEUE_URL,
  //   extractionUrl: process.env.EXTRACTION_SQS_URL,
  // },
  corsEnabledOrigins: process.env.CORS_ENABLED_ORIGINS
    ? process.env.CORS_ENABLED_ORIGINS.split(',')
    : [],

  frontendUrl: process.env.FRONTEND_URL,
  emailAssetUrl: `${process.env.STORAGE_CDN_URL}/public/email-template-images`,
  adminEmail: process.env.ADMIN_EMAIL,
  nodeEnv: process.env.NODE_ENV || 'development',
  sentry: { dsn: process.env.SENTRY_DSN },
  storage: {
    cdnUrl: process.env.STORAGE_CDN_URL,
    bucketName: process.env.S3_BUCKET_NAME,
  },
  optimize: { apiKey: process.env.OPTIMIZE_API_KEY },
  logGroupName: process.env.AWS_CLOUDWATCH_GROUP_NAME || 'connexus-logs',
  isDev: process.env.NODE_ENV === 'development',
  sqs: {
    baseUrl: 'https://sqs.us-east-1.amazonaws.com/010928214819',
    contractQueueId: process.env.CONTRACT_QUEUE,
    contractExtractionQueueId: process.env.EXTRACTION_QUEUE,
    contractSowQueueId: process.env.SCOPE_OF_WORK_QUEUE,
    clientScopeOfWorkQueueId: process.env.CLIENT_SCOPE_OF_WORK_QUEUE,
    templateGenerationQueueId: process.env.TEMPLATE_GENERATION_QUEUE,
    exportQueueId: process.env.EXPORT_QUEUE,
  },
  onlyOffice: {
    jwtSecret: process.env.ONLYOFFICE_JWT_SECRET,
    callbackUrl: process.env.ONLYOFFICE_CALLBACK_URL,
  },
  gpt: {
    endpoint: process.env.OPENAI_ENDPOINT,
    apiKey: process.env.OPENAI_API_KEY,
    deploymentVersion: process.env.OPENAI_DEPLOYMENT_VERSION,
  },
  backgroundJob: {
    exportQueueUrl: process.env.EXPORT_QUEUE_URL,
  },
};
