-- Change existing values to false
UPDATE "Client" SET "onlyApprovedVendors" = false WHERE "onlyApprovedVendors" IS NULL;

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "onlyApprovedVendors" SET NOT NULL,
ALTER COLUMN "onlyApprovedVendors" SET DEFAULT false;
