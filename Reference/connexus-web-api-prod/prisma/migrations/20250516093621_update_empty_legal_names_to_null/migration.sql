-- Update all empty legal names to NULL
UPDATE "Vendors"
SET "vendorLegalName" = NULL
WHERE "vendorLegalName" = '';