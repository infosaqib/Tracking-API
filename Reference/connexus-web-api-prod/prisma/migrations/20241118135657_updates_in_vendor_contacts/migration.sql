/*
  Warnings:

  - Made the column `userId` on table `VendorContacts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vendorId` on table `VendorContacts` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "VendorContacts" DROP CONSTRAINT "VendorContacts_updaterId_fkey";

-- DropForeignKey
ALTER TABLE "VendorContacts" DROP CONSTRAINT "VendorContacts_userId_fkey";

-- DropForeignKey
ALTER TABLE "VendorContacts" DROP CONSTRAINT "VendorContacts_vendorId_fkey";

-- AlterTable
ALTER TABLE "VendorContacts" ALTER COLUMN "updaterId" DROP NOT NULL,
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "vendorId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "VendorContacts" ADD CONSTRAINT "VendorContacts_updaterId_fkey" FOREIGN KEY ("updaterId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorContacts" ADD CONSTRAINT "VendorContacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorContacts" ADD CONSTRAINT "VendorContacts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
