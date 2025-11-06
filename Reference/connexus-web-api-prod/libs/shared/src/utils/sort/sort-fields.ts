import { Prisma } from '@prisma/client';

export const sortFields: Partial<{
  [key in Prisma.ModelName]: string[];
}> = {};
