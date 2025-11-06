/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `ScopeOfWork` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ScopeOfWorkStatuses" ADD VALUE 'REJECTED';
ALTER TYPE "ScopeOfWorkStatuses" ADD VALUE 'PROCESSING';

-- AlterTable
ALTER TABLE "ScopeOfWork" DROP COLUMN "isDeleted",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "fileUrl" TEXT;
