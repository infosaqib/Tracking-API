/*
  Warnings:

  - The values [AWAITING_APPROVAL] on the enum `BackgroundJobStatuses` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BackgroundJobStatuses_new" AS ENUM ('PENDING', 'COMPLETED', 'PENDING_FOR_APPROVAL', 'FAILED');
ALTER TABLE "BackgroundJobs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "BackgroundJobs" ALTER COLUMN "status" TYPE "BackgroundJobStatuses_new" USING ("status"::text::"BackgroundJobStatuses_new");
ALTER TYPE "BackgroundJobStatuses" RENAME TO "BackgroundJobStatuses_old";
ALTER TYPE "BackgroundJobStatuses_new" RENAME TO "BackgroundJobStatuses";
DROP TYPE "BackgroundJobStatuses_old";
ALTER TABLE "BackgroundJobs" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
