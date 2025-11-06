/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `VendorInsurances` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VendorInsurances" DROP COLUMN "isDeleted",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vendors" ADD COLUMN     "certInsuranceExpiry" TIMESTAMP(3);
