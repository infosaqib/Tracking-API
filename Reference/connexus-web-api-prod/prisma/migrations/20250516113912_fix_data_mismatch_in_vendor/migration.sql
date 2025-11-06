-- Fix data mismatch in vendor insurance
UPDATE "Vendors"
SET "certInsurance" = NULL
WHERE "certInsurance" = '';

-- Fix data mismatch in vendor W9 URL
UPDATE "Vendors"
SET "vendorW9Url" = NULL
WHERE "vendorW9Url" = '';
