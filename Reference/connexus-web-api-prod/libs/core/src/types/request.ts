import { RequestUser } from '@app/shared';
import { Users } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

export interface RequestWithUser extends ExpressRequest {
  headers: {
    authorization?: string;
  };
  user?: Users;
  awsUser?: RequestUser;
  __sentry_transaction_name?: string;
  originalUrl?: string;
}
