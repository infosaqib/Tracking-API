/*
  Warnings:

  - You are about to drop the column `rfpServiceId` on the `Rfps` table. All the data in the column will be lost.
  - You are about to drop the `RfpDefinedServices` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `serviceId` to the `Rfps` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RfpDefinedServices" DROP CONSTRAINT "RfpDefinedServices_createdById_fkey";

-- DropForeignKey
ALTER TABLE "RfpDefinedServices" DROP CONSTRAINT "RfpDefinedServices_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "Rfps" DROP CONSTRAINT "Rfps_rfpServiceId_fkey";

-- AlterTable
ALTER TABLE "Rfps" DROP COLUMN "rfpServiceId",
ADD COLUMN     "serviceId" TEXT NOT NULL;

-- DropTable
DROP TABLE "RfpDefinedServices";

-- AddForeignKey
ALTER TABLE "Rfps" ADD CONSTRAINT "Rfps_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
