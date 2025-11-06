/*
  Warnings:

  - Added the required column `citiesId` to the `Vendors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Vendors` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VendorStatuses" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "VendorUnionTypes" AS ENUM ('NONE', 'UNION', 'NON_UNION');

-- CreateEnum
CREATE TYPE "VendorDocumentStatus" AS ENUM ('PRIMARY', 'SECONDARY', 'TERTIARY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TenantTypes" ADD VALUE 'VENDOR_BRANCH';
ALTER TYPE "TenantTypes" ADD VALUE 'VENDOR_FRANCHISE';
ALTER TYPE "TenantTypes" ADD VALUE 'PROPERTY_GROUP';

-- AlterTable
ALTER TABLE "Vendors" ADD COLUMN     "accountantId" TEXT,
ADD COLUMN     "citiesId" TEXT NOT NULL,
ADD COLUMN     "cityId" TEXT,
ADD COLUMN     "countryId" TEXT,
ADD COLUMN     "countyId" TEXT,
ADD COLUMN     "stateId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "vendorEin" TEXT,
ADD COLUMN     "vendorExperience" INTEGER,
ADD COLUMN     "vendorInterestedReceiveRfpOutside" BOOLEAN,
ADD COLUMN     "vendorLegalName" TEXT,
ADD COLUMN     "vendorOwnership" TEXT,
ADD COLUMN     "vendorServiceCoverContinentalUs" BOOLEAN,
ADD COLUMN     "vendorSocialSecurityNumber" TEXT,
ADD COLUMN     "vendorSource" TEXT,
ADD COLUMN     "vendorUnion" "VendorUnionTypes",
ADD COLUMN     "vendorW9Url" TEXT,
ADD COLUMN     "vendorWebsite" TEXT,
ADD COLUMN     "vendorZip" TEXT;

-- CreateTable
CREATE TABLE "VendorServices" (
    "vendorId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL DEFAULT 'SERVICE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "modifiedById" TEXT,
    "tenantId" TEXT,

    CONSTRAINT "VendorServices_pkey" PRIMARY KEY ("vendorId","serviceId")
);

-- CreateTable
CREATE TABLE "VendorInsurances" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "insuranceFileUrl" TEXT NOT NULL,
    "policyExpiration" TIMESTAMP(3),
    "documentStatus" "VendorDocumentStatus" NOT NULL DEFAULT 'PRIMARY',
    "insuranceNote" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "modifiedById" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "VendorInsurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorNotes" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "modifiedById" TEXT,
    "tenantId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VendorNotes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServices" ADD CONSTRAINT "VendorServices_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServices" ADD CONSTRAINT "VendorServices_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServices" ADD CONSTRAINT "VendorServices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServices" ADD CONSTRAINT "VendorServices_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServices" ADD CONSTRAINT "VendorServices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInsurances" ADD CONSTRAINT "VendorInsurances_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInsurances" ADD CONSTRAINT "VendorInsurances_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInsurances" ADD CONSTRAINT "VendorInsurances_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInsurances" ADD CONSTRAINT "VendorInsurances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorNotes" ADD CONSTRAINT "VendorNotes_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorNotes" ADD CONSTRAINT "VendorNotes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorNotes" ADD CONSTRAINT "VendorNotes_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorNotes" ADD CONSTRAINT "VendorNotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
