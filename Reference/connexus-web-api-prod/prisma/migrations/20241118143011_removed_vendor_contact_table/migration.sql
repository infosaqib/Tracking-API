/*
  Warnings:

  - You are about to drop the `VendorContacts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VendorContacts" DROP CONSTRAINT "VendorContacts_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "VendorContacts" DROP CONSTRAINT "VendorContacts_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "VendorContacts" DROP CONSTRAINT "VendorContacts_updaterId_fkey";

-- DropForeignKey
ALTER TABLE "VendorContacts" DROP CONSTRAINT "VendorContacts_userId_fkey";

-- DropForeignKey
ALTER TABLE "VendorContacts" DROP CONSTRAINT "VendorContacts_vendorId_fkey";

-- DropTable
DROP TABLE "VendorContacts";
