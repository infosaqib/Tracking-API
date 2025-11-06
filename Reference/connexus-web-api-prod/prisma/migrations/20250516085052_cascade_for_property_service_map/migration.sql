-- DropForeignKey
ALTER TABLE "PropertyServiceMap" DROP CONSTRAINT "PropertyServiceMap_subServiceId_fkey";

-- AddForeignKey
ALTER TABLE "PropertyServiceMap" ADD CONSTRAINT "PropertyServiceMap_subServiceId_fkey" FOREIGN KEY ("subServiceId") REFERENCES "SubServices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
