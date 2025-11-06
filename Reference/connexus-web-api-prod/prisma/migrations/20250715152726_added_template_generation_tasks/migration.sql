-- CreateEnum
CREATE TYPE "TemplateGenerationStatuses" AS ENUM ('COMPLETED', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "TemplateGenerationTypes" AS ENUM ('RFP', 'SOW');

-- CreateEnum
CREATE TYPE "TemplateFileTypes" AS ENUM ('DOCX', 'PDF');

-- CreateTable
CREATE TABLE "TemplateGenerationTasks" (
    "id" TEXT NOT NULL,
    "scopeOfWorkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "TemplateGenerationStatuses" NOT NULL DEFAULT 'PENDING',
    "type" "TemplateGenerationTypes" NOT NULL DEFAULT 'SOW',
    "fileType" "TemplateFileTypes" NOT NULL DEFAULT 'DOCX',
    "fileUrl" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "TemplateGenerationTasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TemplateGenerationTasks" ADD CONSTRAINT "TemplateGenerationTasks_scopeOfWorkId_fkey" FOREIGN KEY ("scopeOfWorkId") REFERENCES "ScopeOfWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateGenerationTasks" ADD CONSTRAINT "TemplateGenerationTasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateGenerationTasks" ADD CONSTRAINT "TemplateGenerationTasks_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
