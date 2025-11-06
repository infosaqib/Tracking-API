/*
  Warnings:

  - You are about to drop the column `deletedOn` on the `Roles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Roles" DROP COLUMN "deletedOn",
ADD COLUMN     "deletedAt" TIMESTAMP(3);
