-- Reorder BackgroundJobStatuses enum
ALTER TABLE "BackgroundJobs" ALTER COLUMN "status" DROP DEFAULT;

ALTER TYPE "BackgroundJobStatuses" RENAME TO "BackgroundJobStatuses_old";
CREATE TYPE "BackgroundJobStatuses" AS ENUM ('COMPLETED', 'ERROR', 'FAILED', 'PENDING_FOR_APPROVAL', 'PENDING');

ALTER TABLE "BackgroundJobs" ALTER COLUMN "status" TYPE "BackgroundJobStatuses" USING ("status"::text::"BackgroundJobStatuses");
DROP TYPE "BackgroundJobStatuses_old";

ALTER TABLE "BackgroundJobs" ALTER COLUMN "status" SET DEFAULT 'PENDING';
