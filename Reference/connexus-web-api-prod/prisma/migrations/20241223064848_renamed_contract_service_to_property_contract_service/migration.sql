/*
  Warnings:

  - You are about to drop the column `derivedProperties` on the `BackgroundJobs` table. All the data in the column will be lost.
  - You are about to drop the column `derivedVendorName` on the `BackgroundJobs` table. All the data in the column will be lost.
  - You are about to drop the column `renewalDuration` on the `BackgroundJobs` table. All the data in the column will be lost.
  - You are about to drop the `ContractServices` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ContractServices" DROP CONSTRAINT "ContractServices_contractId_fkey";

-- DropForeignKey
ALTER TABLE "ContractServices" DROP CONSTRAINT "ContractServices_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ContractServices" DROP CONSTRAINT "ContractServices_modifiedById_fkey";

-- DropForeignKey
ALTER TABLE "ContractServices" DROP CONSTRAINT "ContractServices_serviceId_fkey";

-- AlterTable
ALTER TABLE "BackgroundJobs" DROP COLUMN "derivedProperties",
DROP COLUMN "derivedVendorName",
DROP COLUMN "renewalDuration";

-- AlterTable
ALTER TABLE "Contracts" ADD COLUMN     "derivedVendorName" TEXT,
ADD COLUMN     "renewalDuration" TEXT;

-- DropTable
DROP TABLE "ContractServices";

-- CreateTable
CREATE TABLE "PropertyContractServices" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "serviceId" TEXT,
    "propertyContactId" TEXT NOT NULL,
    "extractedServiceName" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "modifiedById" TEXT,

    CONSTRAINT "PropertyContractServices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PropertyContractServices" ADD CONSTRAINT "PropertyContractServices_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyContractServices" ADD CONSTRAINT "PropertyContractServices_propertyContactId_fkey" FOREIGN KEY ("propertyContactId") REFERENCES "PropertyContracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyContractServices" ADD CONSTRAINT "PropertyContractServices_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyContractServices" ADD CONSTRAINT "PropertyContractServices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyContractServices" ADD CONSTRAINT "PropertyContractServices_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
