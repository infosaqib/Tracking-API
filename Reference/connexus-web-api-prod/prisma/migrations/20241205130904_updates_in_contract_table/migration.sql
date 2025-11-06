/*
  Warnings:

  - You are about to drop the column `contractExecutionType` on the `Contracts` table. All the data in the column will be lost.
  - You are about to drop the column `regularTerminationNotice` on the `Contracts` table. All the data in the column will be lost.
  - The `contractExecution` column on the `Contracts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ContractExecutionTypes" AS ENUM ('A', 'B');

-- DropForeignKey
ALTER TABLE "PropertyContracts" DROP CONSTRAINT "PropertyContracts_propertyId_fkey";

-- AlterTable
ALTER TABLE "Contracts" DROP COLUMN "contractExecutionType",
DROP COLUMN "regularTerminationNotice",
DROP COLUMN "contractExecution",
ADD COLUMN     "contractExecution" "ContractExecutionTypes";

-- AlterTable
ALTER TABLE "PropertyContracts" ALTER COLUMN "propertyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PropertyContracts" ADD CONSTRAINT "PropertyContracts_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "ClientProperties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
