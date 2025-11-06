-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Services" ADD COLUMN     "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE';
