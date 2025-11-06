-- AlterTable
UPDATE "Client" SET "type" = 'HOA' WHERE "type" IS NULL;
ALTER TABLE "Client" ALTER COLUMN "type" SET DEFAULT 'HOA';
