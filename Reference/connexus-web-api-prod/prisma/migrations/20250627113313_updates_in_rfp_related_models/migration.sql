/*
  Warnings:

  - You are about to drop the column `rfpPropertyId` on the `RfpPropertyAttachments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "RfpPropertyAttachments" DROP CONSTRAINT "RfpPropertyAttachments_rfpPropertyId_fkey";

-- AlterTable
ALTER TABLE "RfpProperties" ADD COLUMN     "scopeOfWorkId" TEXT;

-- AlterTable
ALTER TABLE "RfpPropertyAttachments" DROP COLUMN "rfpPropertyId",
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "rfpId" TEXT;

-- AlterTable
ALTER TABLE "Rfps" ADD COLUMN     "contractStartDate" DATE,
ADD COLUMN     "rfiDate" DATE,
ADD COLUMN     "termOfContract" TEXT;

-- AddForeignKey
ALTER TABLE "RfpProperties" ADD CONSTRAINT "RfpProperties_scopeOfWorkId_fkey" FOREIGN KEY ("scopeOfWorkId") REFERENCES "ScopeOfWork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpPropertyAttachments" ADD CONSTRAINT "RfpPropertyAttachments_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "Rfps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpPropertyAttachments" ADD CONSTRAINT "RfpPropertyAttachments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "ClientProperties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
