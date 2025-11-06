/*
  Warnings:

  - The values [A,B,C] on the enum `PropertyBuildingTypes` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `cityId` to the `ClientProperties` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PropertyBuildingTypes_new" AS ENUM ('GARDEN_STYLE', 'MIDRISE', 'HIGHRISE');
ALTER TABLE "ClientProperties" ALTER COLUMN "type" TYPE "PropertyBuildingTypes_new" USING ("type"::text::"PropertyBuildingTypes_new");
ALTER TYPE "PropertyBuildingTypes" RENAME TO "PropertyBuildingTypes_old";
ALTER TYPE "PropertyBuildingTypes_new" RENAME TO "PropertyBuildingTypes";
DROP TYPE "PropertyBuildingTypes_old";
COMMIT;

-- AlterTable
ALTER TABLE "ClientProperties" ADD COLUMN     "cityId" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "propertyManagerId" TEXT,
ADD COLUMN     "tenantId" TEXT;

-- AddForeignKey
ALTER TABLE "ClientProperties" ADD CONSTRAINT "ClientProperties_propertyManagerId_fkey" FOREIGN KEY ("propertyManagerId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProperties" ADD CONSTRAINT "ClientProperties_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProperties" ADD CONSTRAINT "ClientProperties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
