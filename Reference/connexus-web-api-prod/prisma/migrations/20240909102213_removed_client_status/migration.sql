/*
  Warnings:

  - You are about to drop the column `status` on the `Client` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ClientTypes" ADD VALUE 'COMMERCIAL';
ALTER TYPE "ClientTypes" ADD VALUE 'RETAIL';
ALTER TYPE "ClientTypes" ADD VALUE 'HOTEL';

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "status";

-- DropEnum
DROP TYPE "ClientStatus";
