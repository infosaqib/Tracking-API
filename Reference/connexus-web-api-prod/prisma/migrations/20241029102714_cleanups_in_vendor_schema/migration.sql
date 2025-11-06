/*
  Warnings:

  - You are about to drop the column `citiesId` on the `Vendors` table. All the data in the column will be lost.
  - Made the column `cityId` on table `Vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `countryId` on table `Vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `countyId` on table `Vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stateId` on table `Vendors` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Vendors" DROP CONSTRAINT "Vendors_cityId_fkey";

-- DropForeignKey
ALTER TABLE "Vendors" DROP CONSTRAINT "Vendors_countryId_fkey";

-- DropForeignKey
ALTER TABLE "Vendors" DROP CONSTRAINT "Vendors_countyId_fkey";

-- DropForeignKey
ALTER TABLE "Vendors" DROP CONSTRAINT "Vendors_stateId_fkey";

-- AlterTable
ALTER TABLE "Vendors" DROP COLUMN "citiesId",
ALTER COLUMN "cityId" SET NOT NULL,
ALTER COLUMN "countryId" SET NOT NULL,
ALTER COLUMN "countyId" SET NOT NULL,
ALTER COLUMN "stateId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
