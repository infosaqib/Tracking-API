-- CreateEnum
CREATE TYPE "VendorServiceType" AS ENUM ('PRIMARY_SERVICE', 'ADDITIONAL_SERVICE');

-- AlterTable
ALTER TABLE "VendorServices" ADD COLUMN     "vendorServiceType" "VendorServiceType" NOT NULL DEFAULT 'PRIMARY_SERVICE';
