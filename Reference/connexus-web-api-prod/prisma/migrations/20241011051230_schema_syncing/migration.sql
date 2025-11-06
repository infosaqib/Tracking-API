-- DropForeignKey
ALTER TABLE "PropertyServiceMap" DROP CONSTRAINT "PropertyServiceMap_parentServiceMapId_fkey";

-- AddForeignKey
ALTER TABLE "PropertyServiceMap" ADD CONSTRAINT "PropertyServiceMap_parentServiceMapId_fkey" FOREIGN KEY ("parentServiceMapId") REFERENCES "PropertyServiceMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
