/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { RoleLevel } from '../../../src/services/roles/dto/role-level';
import { db } from '../db';
import servicesSeedData, { SubServicesSeedData } from './data';

const prisma = db;

export async function addSubServices() {
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

    const subServices: SubServicesSeedData[] = [];

    // Check if servicesSeedData is defined
    if (!servicesSeedData) {
      throw new Error('servicesSeedData is undefined');
    }

    servicesSeedData.forEach((item) => {
      subServices.push(...item.service.subServices);
    });

    // First, get existing subServices
    const existingSubServices = await prisma.subServices.findMany({
      where: {
        id: {
          in: subServices.map((s) => s.id),
        },
      },
    });

    // Update existing records
    if (existingSubServices.length > 0) {
      await prisma.subServices.updateMany({
        where: {
          id: {
            in: existingSubServices.map((s) => s.id),
          },
        },
        data: {
          updaterId: superAdmin?.id,
        },
      });
    }

    // Create new records
    const newSubServices = subServices.filter(
      (s) => !existingSubServices.find((es) => es.id === s.id),
    );

    if (newSubServices.length > 0) {
      await prisma.subServices.createMany({
        data: newSubServices.map((subService) => ({
          subServiceName: subService.name,
          creatorId: superAdmin?.id,
          id: subService.id,
          updaterId: superAdmin?.id,
          servicesId: subService.serviceId,
        })),
        skipDuplicates: true,
      });
    }
  } catch (error) {
    console.error('Error adding sub services:', error);
    throw error;
  }
}
