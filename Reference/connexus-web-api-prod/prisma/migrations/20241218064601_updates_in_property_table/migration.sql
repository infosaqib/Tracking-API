-- CreateEnum
CREATE TYPE "MultiFamilyBuildingTypes" AS ENUM ('GARDEN_STYLE', 'MIDRISE', 'HIGH_RISE', 'SFR');

-- AlterTable
ALTER TABLE "ClientProperties" ADD COLUMN     "multiFamilyBuildingType" "MultiFamilyBuildingTypes",
ADD COLUMN     "numberOfUnits" INTEGER;
