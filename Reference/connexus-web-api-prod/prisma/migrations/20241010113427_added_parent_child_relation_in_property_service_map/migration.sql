-- AlterTable
ALTER TABLE "PropertyServiceMap" ADD COLUMN     "parentServiceMapId" TEXT;

-- AddForeignKey
ALTER TABLE "PropertyServiceMap" ADD CONSTRAINT "PropertyServiceMap_parentServiceMapId_fkey" FOREIGN KEY ("parentServiceMapId") REFERENCES "PropertyServiceMap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
