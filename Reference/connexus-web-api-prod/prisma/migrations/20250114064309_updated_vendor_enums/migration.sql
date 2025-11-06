/*
  Warnings:

  - The values [NONE] on the enum `VendorUnionTypes` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VendorUnionTypes_new" AS ENUM ('NON_UNION', 'UNION', 'BOTH');
ALTER TABLE "Vendors" ALTER COLUMN "vendorUnion" TYPE "VendorUnionTypes_new" USING ("vendorUnion"::text::"VendorUnionTypes_new");
ALTER TYPE "VendorUnionTypes" RENAME TO "VendorUnionTypes_old";
ALTER TYPE "VendorUnionTypes_new" RENAME TO "VendorUnionTypes";
DROP TYPE "VendorUnionTypes_old";
COMMIT;
