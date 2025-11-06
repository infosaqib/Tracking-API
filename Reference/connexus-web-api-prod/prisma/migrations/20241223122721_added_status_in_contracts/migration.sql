-- CreateEnum
CREATE TYPE "ContractStatuses" AS ENUM ('ACTIVE', 'IN_DRAFT', 'INACTIVE');

-- AlterTable
ALTER TABLE "Contracts" ADD COLUMN     "contractStatus" "ContractStatuses" NOT NULL DEFAULT 'ACTIVE';

-- RenameForeignKey
ALTER TABLE "PropertyContractServices" RENAME CONSTRAINT "PropertyContractServices_propertyContactId_fkey" TO "PropertyContractServices_propertyContractId_fkey";
