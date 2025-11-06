-- CreateEnum
CREATE TYPE "ContractTypes" AS ENUM ('VENDOR', 'CLIENT', 'PROPERTY');

-- CreateEnum
CREATE TYPE "EndTermTerminationTypes" AS ENUM ('NONE', 'EARLY', 'REGULAR');

-- CreateTable
CREATE TABLE "Contracts" (
    "id" TEXT NOT NULL,
    "contractType" "ContractTypes" NOT NULL DEFAULT 'VENDOR',
    "contractStartDate" TIMESTAMP(3) NOT NULL,
    "contractEndDate" TIMESTAMP(3) NOT NULL,
    "contractExecutionType" JSONB,
    "contractExecution" JSONB,
    "costPerUnit" DOUBLE PRECISION,
    "annualContractValue" DOUBLE PRECISION,
    "contractTotalTerm" TEXT,
    "endTermTermination" "EndTermTerminationTypes" NOT NULL DEFAULT 'NONE',
    "earlyTerminationFee" DOUBLE PRECISION,
    "earlyTerminationRequirements" TEXT,
    "regularTerminationNotice" TEXT,
    "noticeRequirements" TEXT,
    "renewalTerms" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "modifiedById" TEXT,

    CONSTRAINT "Contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractServices" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "serviceId" TEXT,
    "extractedServiceName" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "modifiedById" TEXT,

    CONSTRAINT "ContractServices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyContracts" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "extractedPropertyName" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "modifiedById" TEXT,

    CONSTRAINT "PropertyContracts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contracts" ADD CONSTRAINT "Contracts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contracts" ADD CONSTRAINT "Contracts_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractServices" ADD CONSTRAINT "ContractServices_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractServices" ADD CONSTRAINT "ContractServices_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractServices" ADD CONSTRAINT "ContractServices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractServices" ADD CONSTRAINT "ContractServices_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyContracts" ADD CONSTRAINT "PropertyContracts_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "ClientProperties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyContracts" ADD CONSTRAINT "PropertyContracts_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyContracts" ADD CONSTRAINT "PropertyContracts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyContracts" ADD CONSTRAINT "PropertyContracts_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
