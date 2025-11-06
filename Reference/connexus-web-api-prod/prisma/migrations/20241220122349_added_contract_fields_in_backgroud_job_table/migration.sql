-- AlterTable
ALTER TABLE "BackgroundJobs" ADD COLUMN     "derivedProperties" JSONB,
ADD COLUMN     "derivedVendorName" TEXT,
ADD COLUMN     "renewalDuration" TIMESTAMP(3);
