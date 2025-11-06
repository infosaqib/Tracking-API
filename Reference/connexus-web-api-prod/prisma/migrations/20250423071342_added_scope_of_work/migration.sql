-- CreateEnum
CREATE TYPE "ScopeOfWorkTypes" AS ENUM ('BASE_SCOPE_LIBRARY', 'CLIENT_SCOPE_LIBRARY', 'CLIENT_SCOPE_OF_WORK');

-- CreateEnum
CREATE TYPE "ScopeOfWorkStatuses" AS ENUM ('ACTIVE', 'DRAFT', 'INACTIVE');

-- CreateTable
CREATE TABLE "ScopeOfWork" (
    "id" TEXT NOT NULL,
    "scopeName" VARCHAR(250) NOT NULL,
    "scopeType" "ScopeOfWorkTypes" NOT NULL DEFAULT 'BASE_SCOPE_LIBRARY',
    "scopeOfWorkStatus" "ScopeOfWorkStatuses" NOT NULL DEFAULT 'ACTIVE',
    "serviceId" TEXT,
    "subServiceId" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "modifiedById" TEXT,

    CONSTRAINT "ScopeOfWork_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScopeOfWork" ADD CONSTRAINT "ScopeOfWork_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeOfWork" ADD CONSTRAINT "ScopeOfWork_subServiceId_fkey" FOREIGN KEY ("subServiceId") REFERENCES "SubServices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeOfWork" ADD CONSTRAINT "ScopeOfWork_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeOfWork" ADD CONSTRAINT "ScopeOfWork_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeOfWork" ADD CONSTRAINT "ScopeOfWork_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
