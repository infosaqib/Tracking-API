import { envValues } from '@app/core';
import { Prisma, PrismaClient } from '@prisma/client';
import { withOptimize } from '@prisma/extension-optimize';
import pagination from 'prisma-extension-pagination';

export const extendedPrismaClient = new PrismaClient({
  errorFormat: 'pretty',
  transactionOptions: {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 30000,
    timeout: 30000,
  },
})
  .$extends(pagination({}))
  .$extends(
    envValues.optimize.apiKey
      ? withOptimize({
          apiKey: envValues.optimize.apiKey,
        })
      : {},
  );

export type ExtendedPrismaClient = typeof extendedPrismaClient;
