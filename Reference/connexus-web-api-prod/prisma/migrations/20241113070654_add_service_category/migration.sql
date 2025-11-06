-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('CAPEX', 'OPEX', 'OTHER', 'COMMERCIAL');

-- AlterTable
ALTER TABLE "Services" ADD COLUMN     "category" "ServiceCategory" NOT NULL DEFAULT 'OPEX';
