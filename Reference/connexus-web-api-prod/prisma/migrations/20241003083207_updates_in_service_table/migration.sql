/*
  Warnings:

  - You are about to drop the column `fkServiceApprovedBy` on the `Services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Services" DROP COLUMN "fkServiceApprovedBy",
ADD COLUMN     "serviceApprovedBy" TEXT;
