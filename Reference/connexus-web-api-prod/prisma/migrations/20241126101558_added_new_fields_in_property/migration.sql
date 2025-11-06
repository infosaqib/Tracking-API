/*
  Warnings:

  - You are about to drop the `VendorInsurances` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "HOAType" AS ENUM ('SF', 'CONDOS', 'TOWNHOMES');

-- CreateEnum
CREATE TYPE "StudentHousingType" AS ENUM ('ON_CAMPUS', 'OFF_CAMPUS', 'SFR', 'DORMITORY');

-- CreateEnum
CREATE TYPE "BuildingClassification" AS ENUM ('CLASS_A', 'CLASS_B', 'CLASS_C');

-- CreateEnum
CREATE TYPE "CommercialType" AS ENUM ('RETAIL', 'OFFICE', 'INDUSTRIAL', 'MIXED_USE');

-- AlterEnum
ALTER TYPE "ClientTypes" ADD VALUE 'STUDENT_HOUSING';

-- DropForeignKey
ALTER TABLE "VendorInsurances" DROP CONSTRAINT "VendorInsurances_createdById_fkey";

-- DropForeignKey
ALTER TABLE "VendorInsurances" DROP CONSTRAINT "VendorInsurances_modifiedById_fkey";

-- DropForeignKey
ALTER TABLE "VendorInsurances" DROP CONSTRAINT "VendorInsurances_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "VendorInsurances" DROP CONSTRAINT "VendorInsurances_vendorId_fkey";

-- AlterTable
ALTER TABLE "ClientProperties" ADD COLUMN     "buildingClassification" "BuildingClassification",
ADD COLUMN     "commercialClassification" "BuildingClassification",
ADD COLUMN     "commercialType" "CommercialType",
ADD COLUMN     "grossSquareFootage" DOUBLE PRECISION,
ADD COLUMN     "hoaType" "HOAType",
ADD COLUMN     "market" TEXT,
ADD COLUMN     "numberOfBeds" INTEGER,
ADD COLUMN     "numberOfDoors" INTEGER,
ADD COLUMN     "rentableSquareFootage" DOUBLE PRECISION,
ADD COLUMN     "studentHousingType" "StudentHousingType",
ADD COLUMN     "yearBuilt" INTEGER;

-- DropTable
DROP TABLE "VendorInsurances";

-- DropEnum
DROP TYPE "VendorDocumentStatus";
