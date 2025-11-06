import { db } from '../db';

export async function syncPropertyManagers() {
  const properties = await db.clientProperties.findMany();

  await db.propertyContacts.createMany({
    data: properties.map((p) => ({
      userId: p.propertyManagerId,
      propertyId: p.id,
      creatorId: p.creatorId,
      updaterId: p.creatorId,
    })),
    skipDuplicates: true,
  });
}
