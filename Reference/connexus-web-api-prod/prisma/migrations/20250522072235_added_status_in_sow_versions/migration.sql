-- CreateEnum
CREATE TYPE "ScopeOfWorkVersionStatuses" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "ScopeOfWorkVersion" ADD COLUMN     "status" "ScopeOfWorkVersionStatuses" NOT NULL DEFAULT 'PROCESSING';
