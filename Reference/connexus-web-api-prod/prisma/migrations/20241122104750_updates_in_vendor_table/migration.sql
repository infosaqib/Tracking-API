-- CreateEnum
CREATE TYPE "VendorRegistrationType" AS ENUM ('SELF', 'CONNEXUS');

-- AlterTable
ALTER TABLE "Vendors" ADD COLUMN     "vendorInsuranceCertificate" TEXT,
ADD COLUMN     "vendorInsuranceExpiry" TIMESTAMP(3),
ADD COLUMN     "vendorInsuranceNote" TEXT,
ADD COLUMN     "vendorRegistrationType" "VendorRegistrationType" NOT NULL DEFAULT 'CONNEXUS';
