-- Reorder VendorStatuses enum alphabetically (ACTIVE, DRAFT, INACTIVE)
ALTER TYPE "VendorStatuses" RENAME TO "VendorStatuses_old";
CREATE TYPE "VendorStatuses" AS ENUM ('ACTIVE', 'DRAFT', 'INACTIVE');

-- First drop the default
ALTER TABLE "Vendors" ALTER COLUMN "status" DROP DEFAULT;

-- Then cast the column
ALTER TABLE "Vendors" ALTER COLUMN "status" TYPE "VendorStatuses" USING ("status"::text::"VendorStatuses");

-- Finally, set the default back
ALTER TABLE "Vendors" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

DROP TYPE "VendorStatuses_old";

-- Reorder ServiceCategory enum alphabetically (CAPEX, COMMERCIAL, OPEX, OTHER)
ALTER TYPE "ServiceCategory" RENAME TO "ServiceCategory_old";
CREATE TYPE "ServiceCategory" AS ENUM ('CAPEX', 'COMMERCIAL', 'OPEX', 'OTHER');

-- First drop the default
ALTER TABLE "Services" ALTER COLUMN "category" DROP DEFAULT;

-- Then cast the column
ALTER TABLE "Services" ALTER COLUMN "category" TYPE "ServiceCategory" USING ("category"::text::"ServiceCategory");

-- Finally, set the default back
ALTER TABLE "Services" ALTER COLUMN "category" SET DEFAULT 'OPEX';

DROP TYPE "ServiceCategory_old";

-- Reorder ServiceStatus enum alphabetically (ACTIVE, INACTIVE)
ALTER TYPE "ServiceStatus" RENAME TO "ServiceStatus_old";
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- First drop the default
ALTER TABLE "Services" ALTER COLUMN "status" DROP DEFAULT;

-- Then cast the column
ALTER TABLE "Services" ALTER COLUMN "status" TYPE "ServiceStatus" USING ("status"::text::"ServiceStatus");

-- Finally, set the default back
ALTER TABLE "Services" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

DROP TYPE "ServiceStatus_old";

-- Reorder ClientTypes enum alphabetically (COMMERCIAL, HOA, HOTEL, MULTI_FAMILY, RETAIL, STUDENT_HOUSING)
ALTER TYPE "ClientTypes" RENAME TO "ClientTypes_old";
CREATE TYPE "ClientTypes" AS ENUM ('COMMERCIAL', 'HOA', 'HOTEL', 'MULTI_FAMILY', 'RETAIL', 'STUDENT_HOUSING');

-- First drop the default
ALTER TABLE "Client" ALTER COLUMN "type" DROP DEFAULT;

-- Then cast the column
ALTER TABLE "Client" ALTER COLUMN "type" TYPE "ClientTypes" USING ("type"::text::"ClientTypes");

-- Finally, set the default back
ALTER TABLE "Client" ALTER COLUMN "type" SET DEFAULT 'HOA';

DROP TYPE "ClientTypes_old";
