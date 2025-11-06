/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `UserTenants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Tenants" ADD COLUMN     "parentTenantId" TEXT;

-- AlterTable
ALTER TABLE "UserTenants" DROP COLUMN "isDeleted",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Tenants" ADD CONSTRAINT "Tenants_parentTenantId_fkey" FOREIGN KEY ("parentTenantId") REFERENCES "Tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
