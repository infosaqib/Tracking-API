-- CreateEnum
CREATE TYPE "TenantUserFilterTypes" AS ENUM ('CLIENT', 'PROPERTY', 'MULTI_PROPERTY');

-- AlterTable
ALTER TABLE "UserTenants" ADD COLUMN     "tenantUserFilterType" "TenantUserFilterTypes" NOT NULL DEFAULT 'CLIENT';
