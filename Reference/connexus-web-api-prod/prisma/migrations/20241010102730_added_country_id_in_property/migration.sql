-- DropForeignKey
ALTER TABLE "ClientProperties" DROP CONSTRAINT "ClientProperties_cityId_fkey";

-- AlterTable
ALTER TABLE "ClientProperties" ADD COLUMN     "countyId" TEXT,
ALTER COLUMN "cityId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ClientProperties" ADD CONSTRAINT "ClientProperties_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProperties" ADD CONSTRAINT "ClientProperties_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;
