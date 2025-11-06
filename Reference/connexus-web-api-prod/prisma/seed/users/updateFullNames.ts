/* eslint-disable no-console */
import { db } from '../db';

export async function updateFullNames() {
  try {
    const result = await db.$executeRaw`
      UPDATE "Users"
      SET "fullName" = CONCAT("firstName", ' ', "lastName")
      WHERE "fullName" IS NULL OR "fullName" = '';
    `;
    console.log(`Updated ${result} user(s)`);
  } catch (error) {
    console.error('Error updating full names:', error);
  }
}
