-- AlterEnum
ALTER TYPE "VendorStatuses" ADD VALUE 'DRAFT';

-- DropForeignKey
ALTER TABLE "Vendors" DROP CONSTRAINT "Vendors_cityId_fkey";

-- DropForeignKey
ALTER TABLE "Vendors" DROP CONSTRAINT "Vendors_countryId_fkey";

-- DropForeignKey
ALTER TABLE "Vendors" DROP CONSTRAINT "Vendors_countyId_fkey";

-- DropForeignKey
ALTER TABLE "Vendors" DROP CONSTRAINT "Vendors_stateId_fkey";

-- AlterTable
ALTER TABLE "Vendors" ALTER COLUMN "cityId" DROP NOT NULL,
ALTER COLUMN "countryId" DROP NOT NULL,
ALTER COLUMN "countyId" DROP NOT NULL,
ALTER COLUMN "stateId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
