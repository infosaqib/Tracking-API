/*
  Warnings:

  - The `vendorOwnership` column on the `Vendors` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "VendorOwnership" AS ENUM ('FAMILY_OWNED', 'MINORITY_OWNED', 'VETERAN_OWNED', 'WOMAN_OWNED');

-- AlterTable
ALTER TABLE "Vendors" DROP COLUMN "vendorOwnership",
ADD COLUMN     "vendorOwnership" "VendorOwnership";
