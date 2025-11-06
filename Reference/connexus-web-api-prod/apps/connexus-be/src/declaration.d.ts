import { RequestUser } from '@app/shared';
import { Users } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Users;
      awsUser?: RequestUser;
      __sentry_transaction_name?: string;
    }
  }
}

interface EnvConfig {
  PORT?: string;
  DATABASE_URL?: string;
  SHADOW_DATABASE_URL?: string;
  COGNITO_USER_POOL_ID?: string;
  COGNITO_CLIENT_ID?: string;
  COGNITO_CLIENT_SECRET?: string;
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  CORS_ENABLED_ORIGINS?: string;
  LOAD_TEST_DATA?: string;
}

declare namespace NodeJS {
  interface ProcessEnv extends EnvConfig {}
}
