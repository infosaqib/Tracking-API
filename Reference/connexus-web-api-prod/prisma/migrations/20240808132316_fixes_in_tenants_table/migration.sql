/*
  Warnings:

  - Changed the type of `type` on the `Tenants` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TenantTypes" AS ENUM ('CLIENT', 'VENDOR');

-- DropForeignKey
ALTER TABLE "Tenants" DROP CONSTRAINT "Tenants_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Tenants" DROP CONSTRAINT "Tenants_updaterId_fkey";

-- DropForeignKey
ALTER TABLE "Tenants" DROP CONSTRAINT "Tenants_vendorId_fkey";

-- AlterTable
ALTER TABLE "Tenants" DROP COLUMN "type",
ADD COLUMN     "type" "TenantTypes" NOT NULL,
ALTER COLUMN "vendorId" DROP NOT NULL,
ALTER COLUMN "creatorId" DROP NOT NULL,
ALTER COLUMN "updaterId" DROP NOT NULL;

-- DropEnum
DROP TYPE "TenntTypes";

-- AddForeignKey
ALTER TABLE "Tenants" ADD CONSTRAINT "Tenants_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenants" ADD CONSTRAINT "Tenants_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenants" ADD CONSTRAINT "Tenants_updaterId_fkey" FOREIGN KEY ("updaterId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
