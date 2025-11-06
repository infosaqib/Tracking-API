-- CreateEnum
CREATE TYPE "BackgroundJobStatuses" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "JobTypes" AS ENUM ('AI_CONTRACT_PROCESSING');

-- CreateTable
CREATE TABLE "BackgroundJobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "BackgroundJobStatuses" NOT NULL DEFAULT 'PENDING',
    "jobType" "JobTypes" NOT NULL,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "modifiedById" TEXT,

    CONSTRAINT "BackgroundJobs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BackgroundJobs" ADD CONSTRAINT "BackgroundJobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundJobs" ADD CONSTRAINT "BackgroundJobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundJobs" ADD CONSTRAINT "BackgroundJobs_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
