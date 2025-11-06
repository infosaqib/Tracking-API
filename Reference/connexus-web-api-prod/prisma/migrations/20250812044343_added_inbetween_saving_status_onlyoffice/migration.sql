-- AlterEnum
ALTER TYPE "public"."ScopeOfWorkVersionStatuses" ADD VALUE 'SAVING';

-- AlterTable
ALTER TABLE "public"."ScopeOfWorkVersion" ADD COLUMN     "statusModifiedAt" TIMESTAMP(3);
