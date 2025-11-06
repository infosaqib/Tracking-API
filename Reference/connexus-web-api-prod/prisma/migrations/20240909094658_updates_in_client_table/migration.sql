-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('MULTI_FAMILY', 'HOA', 'COMMERCIAL', 'RETAIL', 'HOTEL');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "description" TEXT,
ADD COLUMN     "legalName" VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN     "onlyApprovedVendors" BOOLEAN,
ADD COLUMN     "status" "ClientStatus",
ADD COLUMN     "website" TEXT;
