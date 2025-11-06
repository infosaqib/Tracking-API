/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { db } from '../db';
import { serviceCategoriesData } from './data';

const prisma = db;

export async function addServiceCategories() {
  try {
    console.log('Starting to seed service categories...');

    const serviceCategories = serviceCategoriesData.map((category) => ({
      name: category.name,
    }));
    // Check for existing categories
    const existingCategories = await prisma.serviceCategories.findMany({
      where: {
        name: {
          in: serviceCategories.map((cat) => cat.name),
        },
      },
    });

    // Filter out categories that already exist
    const existingCategoryNames = new Set(
      existingCategories.map((cat) => cat.name),
    );
    const categoriesToCreate = serviceCategories.filter(
      (category) => !existingCategoryNames.has(category.name),
    );

    if (categoriesToCreate.length === 0) {
      return existingCategories;
    }

    const createdCategories = await prisma.$transaction(
      categoriesToCreate.map((category) =>
        prisma.serviceCategories.create({
          data: {
            name: category.name,
          },
        }),
      ),
    );
    console.log(
      `Successfully seeded ${serviceCategories.length} service categories`,
    );

    return [...existingCategories, ...createdCategories];
  } catch (error) {
    console.error('Error adding service categories:', error);
    throw error;
  }
}

export async function mapServicesToCategories() {
  try {
    console.log('Starting to map services to categories...');

    // Get all service categories
    const serviceCategories = await prisma.serviceCategories.findMany({
      where: {
        deletedAt: null,
      },
    });
    const categoryMap = new Map(
      serviceCategories.map((cat: any) => [cat.name, cat.id]),
    );

    // Get all services that need category mapping
    const services = await prisma.services.findMany({
      where: {
        categoryId: null,
      },
    });

    console.log(`Found ${services.length} services that need category mapping`);

    // Update services with categoryId
    const updatePromises = services.map((service: any) => {
      const categoryId = categoryMap.get(service.category);
      if (!categoryId) {
        console.warn(
          `No category found for service: ${service.servicesName} with category: ${service.category}`,
        );
        return Promise.resolve();
      }

      return prisma.services.update({
        where: { id: service.id },
        data: {
          categoryId,
        },
      });
    });

    await Promise.all(updatePromises);

    console.log('Successfully mapped services to categories');
  } catch (error) {
    console.error('Error mapping services to categories:', error);
    throw error;
  }
}
