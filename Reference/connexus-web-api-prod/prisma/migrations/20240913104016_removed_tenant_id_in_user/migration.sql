/*
  Warnings:

  - You are about to drop the column `tenantsId` on the `Users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_tenantsId_fkey";

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "tenantsId";
