/*
  Warnings:

  - The values [PUBLISHED] on the enum `RfpStatusType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RfpStatusType_new" AS ENUM ('ACTIVE', 'AWARD_PENDING', 'AWARDED', 'CANCELLED', 'CLOSED', 'CLOSED_FOR_BIDS', 'DEACTIVE', 'DRAFT', 'IN_BID_REVIEW', 'OPEN_FOR_BIDS');
ALTER TABLE "Rfps" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Rfps" ALTER COLUMN "status" TYPE "RfpStatusType_new" USING ("status"::text::"RfpStatusType_new");
ALTER TYPE "RfpStatusType" RENAME TO "RfpStatusType_old";
ALTER TYPE "RfpStatusType_new" RENAME TO "RfpStatusType";
DROP TYPE "RfpStatusType_old";
ALTER TABLE "Rfps" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
