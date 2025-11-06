-- CreateEnum
CREATE TYPE "ExportBackgroundJobStatus" AS ENUM ('COMPLETED', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "ExportFileTypes" AS ENUM ('CSV', 'XLSX', 'PDF');


-- CreateTable
CREATE TABLE "ExportBackgroundJobs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "ExportBackgroundJobStatus" NOT NULL DEFAULT 'PENDING',
    "filePath" TEXT,
    "fileType" "ExportFileTypes" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "ExportBackgroundJobs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExportBackgroundJobs" ADD CONSTRAINT "ExportBackgroundJobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportBackgroundJobs" ADD CONSTRAINT "ExportBackgroundJobs_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
