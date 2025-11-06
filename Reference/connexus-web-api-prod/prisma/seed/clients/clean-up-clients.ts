import { db } from '../db';

export const cleanUpClients = async () => {
  await db.client.deleteMany({
    where: {
      tenantId: null,
    },
  });

  await db.client.updateMany({
    where: {
      deletedAt: null,
      tenantId: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};
