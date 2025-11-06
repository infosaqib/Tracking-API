/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { ServiceCategory } from '@prisma/client';
import { RoleLevel } from '../../../src/services/roles/dto/role-level';
import { db } from '../db';
import servicesSeedData from './data';

const prisma = db;

export async function addServices() {
  try {
    const superAdmin = await prisma.users.findFirst({
      where: {
        userRoles: {
          some: {
            role: { roleLevel: RoleLevel.SuperAdmin },
          },
        },
      },
    });

    // await prisma.propertyServiceMap.deleteMany();
    // await prisma.subServices.deleteMany();
    // await prisma.services.deleteMany();

    // Mapping services from seed data
    const services = servicesSeedData.map((item) => {
      return {
        id: item.service.id,
        name: item.service.name,
        category: item.service.category as ServiceCategory,
      };
    });

    await prisma.$transaction(
      services.map((service) =>
        prisma.services.upsert({
          where: { id: service.id },
          update: {
            servicesName: service.name,
            updaterId: superAdmin?.id,
            category: service.category,
          },
          create: {
            servicesName: service.name,
            creatorId: superAdmin?.id,
            id: service.id,
            updaterId: superAdmin?.id,
            serviceApprovedById: superAdmin?.id,
            serviceApprovedOn: new Date(),
            category: service.category,
          },
        }),
      ),
    );
  } catch (error) {
    console.error('Error adding services:', error);
    // Handle the error as needed (e.g., throw, log, etc.)
  }
}
