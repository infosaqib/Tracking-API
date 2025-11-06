-- AlterEnum
ALTER TYPE "JobTypes" ADD VALUE 'ZIP_EXTRACTION_PROCESSING';

-- AlterTable
ALTER TABLE "BackgroundJobs" ADD COLUMN     "parentId" TEXT;
