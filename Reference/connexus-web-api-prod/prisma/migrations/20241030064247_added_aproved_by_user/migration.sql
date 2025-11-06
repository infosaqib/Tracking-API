/*
  Warnings:

  - You are about to drop the column `serviceApprovedBy` on the `Services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Services" DROP COLUMN "serviceApprovedBy",
ADD COLUMN     "serviceApprovedById" TEXT;

-- AddForeignKey
ALTER TABLE "Services" ADD CONSTRAINT "Services_serviceApprovedById_fkey" FOREIGN KEY ("serviceApprovedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
