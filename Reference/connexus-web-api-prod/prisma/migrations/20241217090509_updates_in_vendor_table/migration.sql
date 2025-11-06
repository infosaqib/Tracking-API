-- AlterTable
ALTER TABLE "Vendors" ADD COLUMN     "accountantId" TEXT;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_accountantId_fkey" FOREIGN KEY ("accountantId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
