-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "UserTenants" (
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isPrimaryTenant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "modifiedById" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserTenants_pkey" PRIMARY KEY ("userId","tenantId")
);

-- AddForeignKey
ALTER TABLE "UserTenants" ADD CONSTRAINT "UserTenants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenants" ADD CONSTRAINT "UserTenants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenants" ADD CONSTRAINT "UserTenants_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenants" ADD CONSTRAINT "UserTenants_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
