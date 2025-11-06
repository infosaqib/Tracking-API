/*
  Warnings:

  - The values [NON_UNION] on the enum `VendorUnionTypes` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VendorUnionTypes_new" AS ENUM ('NONE', 'UNION', 'BOTH');
ALTER TABLE "Vendors" ALTER COLUMN "vendorUnion" TYPE "VendorUnionTypes_new" USING ("vendorUnion"::text::"VendorUnionTypes_new");
ALTER TYPE "VendorUnionTypes" RENAME TO "VendorUnionTypes_old";
ALTER TYPE "VendorUnionTypes_new" RENAME TO "VendorUnionTypes";
DROP TYPE "VendorUnionTypes_old";
COMMIT;

-- AlterTable
ALTER TABLE "Contracts" ALTER COLUMN "annualContractValue" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "PropertyContractServices" ADD COLUMN     "baseServiceCost" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "ApprovedClientVendors" (
    "clientId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovedClientVendors_pkey" PRIMARY KEY ("clientId","vendorId")
);

-- AddForeignKey
ALTER TABLE "ApprovedClientVendors" ADD CONSTRAINT "ApprovedClientVendors_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovedClientVendors" ADD CONSTRAINT "ApprovedClientVendors_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
