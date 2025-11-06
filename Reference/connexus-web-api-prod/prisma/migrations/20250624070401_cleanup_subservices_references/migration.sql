-- This is an empty migration.

-- =============================================
-- Step 2: Update Foreign Key Relationships  
-- =============================================

-- Update PropertyServiceMap: Replace subServiceId references with serviceId
-- For records that have subServiceId, update serviceId to point to the migrated service
UPDATE "PropertyServiceMap" 
SET "serviceId" = "subServiceId"
WHERE "subServiceId" IS NOT NULL;

-- Update ScopeOfWork: Replace subServiceId references with serviceId
-- For records that have subServiceId, update serviceId to point to the migrated service
UPDATE "ScopeOfWork"
SET "serviceId" = "subServiceId" 
WHERE "subServiceId" IS NOT NULL;

-- =============================================
-- Step 3: Schema Cleanup - Remove SubServices references
-- =============================================

-- Remove subServiceId column from PropertyServiceMap
ALTER TABLE "PropertyServiceMap" DROP CONSTRAINT IF EXISTS "PropertyServiceMap_subServiceId_fkey";
ALTER TABLE "PropertyServiceMap" DROP COLUMN IF EXISTS "subServiceId";

-- Remove serviceType column from PropertyServiceMap  
ALTER TABLE "PropertyServiceMap" DROP COLUMN IF EXISTS "serviceType";

-- Remove parent/children relationship columns from PropertyServiceMap
ALTER TABLE "PropertyServiceMap" DROP CONSTRAINT IF EXISTS "PropertyServiceMap_parentId_fkey";
ALTER TABLE "PropertyServiceMap" DROP COLUMN IF EXISTS "parentId";

-- Remove subServiceId from ScopeOfWork table
ALTER TABLE "ScopeOfWork" DROP CONSTRAINT IF EXISTS "ScopeOfWork_subServiceId_fkey";
ALTER TABLE "ScopeOfWork" DROP COLUMN IF EXISTS "subServiceId";

-- Remove serviceType from VendorServices table
ALTER TABLE "VendorServices" DROP COLUMN IF EXISTS "serviceType";

-- Remove subServices relation from Services table
ALTER TABLE "Services" DROP CONSTRAINT IF EXISTS "Services_subServices_fkey";

-- =============================================
-- Step 4: Drop ServiceType enum only (keep SubServices table for now)
-- =============================================

-- Drop ServiceType enum
DROP TYPE IF EXISTS "ServiceType";

-- =============================================
-- VERIFICATION QUERIES (commented out)
-- Run these manually after migration to verify data integrity
-- =============================================

-- Verify parent-child relationships in Services:
-- SELECT s1."servicesName" as child_service, s2."servicesName" as parent_service 
-- FROM "Services" s1 
-- JOIN "Services" s2 ON s1."parentServiceId" = s2.id 
-- WHERE s1."parentServiceId" IS NOT NULL;

-- Verify PropertyServiceMap data integrity:
-- SELECT COUNT(*) FROM "PropertyServiceMap";

-- Check for orphaned service references:
-- SELECT COUNT(*) FROM "PropertyServiceMap" psm 
-- LEFT JOIN "Services" s ON psm."serviceId" = s.id 
-- WHERE s.id IS NULL;

-- Verify ScopeOfWork references:
-- SELECT COUNT(*) FROM "ScopeOfWork" WHERE "serviceId" IS NOT NULL;