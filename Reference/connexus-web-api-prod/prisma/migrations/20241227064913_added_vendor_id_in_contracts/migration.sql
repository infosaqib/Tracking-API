-- AlterTable
ALTER TABLE "Contracts" ADD COLUMN     "vendorId" TEXT;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "phoneExtension" VARCHAR(20);

-- AddForeignKey
ALTER TABLE "Contracts" ADD CONSTRAINT "Contracts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
