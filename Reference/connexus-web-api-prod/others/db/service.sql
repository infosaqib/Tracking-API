-- Services Management Script with Duplication Handling
-- This script adds new services and removes specified services with proper duplicate handling

-- Use transaction for atomicity
BEGIN;

-- Create a temporary table to track our operations
CREATE TEMP TABLE service_operations (
    operation_type TEXT,
    service_name TEXT,
    action_taken TEXT,
    service_id TEXT
);

DO $$
DECLARE
    super_admin_id TEXT;
    service_record RECORD;
    operation_count INTEGER;
BEGIN
    -- Get a super admin user ID
    SELECT u.id INTO super_admin_id
    FROM "Users" u
    JOIN "UserRoles" ur ON u.id = ur."userId"
    JOIN "Roles" r ON ur."roleId" = r.id
    WHERE r."roleLevel" = 1
    LIMIT 1;

    -- If no super admin found, use the first user
    IF super_admin_id IS NULL THEN
        SELECT id INTO super_admin_id FROM "Users" LIMIT 1;
    END IF;

    RAISE NOTICE 'Using super admin ID: %', super_admin_id;

    -- Step 1: Handle services to be removed (soft delete)
    -- But exclude 'Pump Maintenance' as we want to keep it as standalone
    UPDATE "Services" 
    SET "deletedAt" = NOW(),
        "modifiedAt" = NOW(),
        "updaterId" = super_admin_id
    WHERE "servicesName" IN (
        'Air Duct Cleaning',
        'Boiler Maintenance',
        'Dryer Vent Cleaning',
        'Staffed Services',
        'Janitorial',
        'Emergency Maintenance',
        'Concierges',
        'On-site Guard (Armed)',
        'On-site Guard (Unarmed)',
        'On-site Patrolling (Armed)',
        'On-site Patrolling (Unarmed)',
        'Off-site Surveillances'
    ) AND "deletedAt" IS NULL;

    GET DIAGNOSTICS operation_count = ROW_COUNT;
    INSERT INTO service_operations VALUES ('REMOVE', 'Multiple Services', 'Soft deleted ' || operation_count || ' services', NULL);

    -- Step 2: Handle Pump Maintenance - convert from sub-service to main service
    -- First check if it exists as a sub-service (has parentServiceId)
    SELECT * INTO service_record 
    FROM "Services" 
    WHERE "servicesName" = 'Pump Maintenance' 
    AND "deletedAt" IS NULL 
    LIMIT 1;

    IF FOUND THEN
        -- Update existing Pump Maintenance to be a standalone service
        UPDATE "Services"
        SET "parentServiceId" = NULL,
            "modifiedAt" = NOW(),
            "updaterId" = super_admin_id,
            category = 'OPEX',
            status = 'ACTIVE'
        WHERE id = service_record.id;
        
        INSERT INTO service_operations VALUES ('UPDATE', 'Pump Maintenance', 'Converted to standalone service', service_record.id);
        RAISE NOTICE 'Updated existing Pump Maintenance service to standalone';
    ELSE
        -- Create new Pump Maintenance service
        INSERT INTO "Services" (
            id, "servicesName", category, status, "createdAt", "modifiedAt", 
            "creatorId", "updaterId", "serviceApprovedById", "serviceApprovedOn"
        ) VALUES (
            gen_random_uuid(), 'Pump Maintenance', 'OPEX', 'ACTIVE', NOW(), NOW(),
            super_admin_id, super_admin_id, super_admin_id, NOW()
        );
        INSERT INTO service_operations VALUES ('CREATE', 'Pump Maintenance', 'Created new service', NULL);
        RAISE NOTICE 'Created new Pump Maintenance service';
    END IF;

    -- Step 3: Add new services with duplication checks and correct categories
    
    -- Vent Cleaning (OPEX)
    IF NOT EXISTS (SELECT 1 FROM "Services" WHERE "servicesName" = 'Vent Cleaning' AND "deletedAt" IS NULL) THEN
        INSERT INTO "Services" (
            id, "servicesName", category, status, "createdAt", "modifiedAt", 
            "creatorId", "updaterId", "serviceApprovedById", "serviceApprovedOn"
        ) VALUES (
            gen_random_uuid(), 'Vent Cleaning', 'OPEX', 'ACTIVE', NOW(), NOW(),
            super_admin_id, super_admin_id, super_admin_id, NOW()
        );
        INSERT INTO service_operations VALUES ('CREATE', 'Vent Cleaning', 'Created new service (OPEX)', NULL);
        RAISE NOTICE 'Created Vent Cleaning service (OPEX)';
    ELSE
        INSERT INTO service_operations VALUES ('SKIP', 'Vent Cleaning', 'Similar service already exists', NULL);
        RAISE NOTICE 'Skipped Vent Cleaning - similar service exists';
    END IF;

    -- Cooling Tower (OPEX)
    IF NOT EXISTS (SELECT 1 FROM "Services" WHERE "servicesName" = 'Cooling Tower' AND "deletedAt" IS NULL) THEN
        INSERT INTO "Services" (
            id, "servicesName", category, status, "createdAt", "modifiedAt", 
            "creatorId", "updaterId", "serviceApprovedById", "serviceApprovedOn"
        ) VALUES (
            gen_random_uuid(), 'Cooling Tower', 'OPEX', 'ACTIVE', NOW(), NOW(),
            super_admin_id, super_admin_id, super_admin_id, NOW()
        );
        INSERT INTO service_operations VALUES ('CREATE', 'Cooling Tower', 'Created new service (OPEX)', NULL);
        RAISE NOTICE 'Created Cooling Tower service (OPEX)';
    ELSE
        INSERT INTO service_operations VALUES ('SKIP', 'Cooling Tower', 'Similar service already exists', NULL);
        RAISE NOTICE 'Skipped Cooling Tower - similar service exists';
    END IF;

    -- Generator (OPEX)
    IF NOT EXISTS (SELECT 1 FROM "Services" WHERE "servicesName" = 'Generator' AND "deletedAt" IS NULL) THEN
        INSERT INTO "Services" (
            id, "servicesName", category, status, "createdAt", "modifiedAt", 
            "creatorId", "updaterId", "serviceApprovedById", "serviceApprovedOn"
        ) VALUES (
            gen_random_uuid(), 'Generator', 'OPEX', 'ACTIVE', NOW(), NOW(),
            super_admin_id, super_admin_id, super_admin_id, NOW()
        );
        INSERT INTO service_operations VALUES ('CREATE', 'Generator', 'Created new service (OPEX)', NULL);
        RAISE NOTICE 'Created Generator service (OPEX)';
    ELSE
        INSERT INTO service_operations VALUES ('SKIP', 'Generator', 'Similar service already exists', NULL);
        RAISE NOTICE 'Skipped Generator - similar service exists';
    END IF;

    -- Step 4: Note about existing services
    -- We do NOT update categories of existing services per user request
    -- Only new services get their specified categories

    -- All existing services (COMMERCIAL category ones) are left as-is
    -- They should already exist and we do not modify their categories
    
    -- Step 5: Verify all required services exist and have correct categories
    -- This is just a verification step - we don't create these as they should exist
    
    RAISE NOTICE 'Services update completed successfully!';
    RAISE NOTICE 'Super admin ID used: %', super_admin_id;
    
END $$;

-- Show operation summary
SELECT 
    operation_type,
    service_name,
    action_taken,
    COUNT(*) as count
FROM service_operations 
GROUP BY operation_type, service_name, action_taken
ORDER BY operation_type, service_name;

-- Verify newly added/updated services
SELECT 
    'New/Updated Services' as category,
    "servicesName",
    category,
    status,
    "parentServiceId",
    "createdAt",
    "modifiedAt"
FROM "Services" 
WHERE "servicesName" IN ('Vent Cleaning', 'Pump Maintenance', 'Cooling Tower', 'Generator')
AND "deletedAt" IS NULL
ORDER BY "servicesName";

-- Verify existing services (categories left unchanged)
SELECT 
    'Existing Services' as service_group,
    "servicesName",
    category,
    status,
    CASE WHEN "deletedAt" IS NULL THEN 'ACTIVE' ELSE 'DELETED' END as service_state
FROM "Services" 
WHERE "servicesName" IN (
    'Refuse Removal',
    'R&M HVAC - Contract',
    'R&M HVAC - Water Treatment', 
    'R&M Plumbing',
    'R&M Elevator - Contract',
    'R&M Elevator - Phones',
    'R&M Elevator - Other',
    'Cleaning - Contract',
    'Cleaning - Vacant',
    'Cleaning - Windows',
    'Day Porter / Matron',
    'Cleaning - Other',
    'Landscaping - Contract',
    'Landscaping - Irrigation',
    'Landscaping - Interior Plants',
    'Landscaping - Other',
    'Pressure Wash',
    'Parking R&M',
    'Parking Lot Sweeping',
    'Snow Removal',
    'R&M Other - Uniforms',
    'R&M Other - General Building Supplies',
    'R&M Other - Stone/Metal/Wood Maintenance',
    'R&M Other - Glass',
    'R&M Other - Keys & Locks',
    'R&M Other - Pest Control',
    'R&M Structural / Roof',
    'R&M Fitness Center',
    'R&M Other - Interior Repairs',
    'Security - Guard Contract',
    'Security - Other Equipment/Cards',
    'R&M Fire / Life Safety Alarm Contract',
    'R&M Fire/Fire Safety Repairs',
    'Building Improvements',
    'Tenant Improvements'
)
ORDER BY category, "servicesName";

-- Verify new OPEX services
SELECT 
    'New OPEX Services' as service_group,
    "servicesName",
    category,
    status,
    CASE WHEN "deletedAt" IS NULL THEN 'ACTIVE' ELSE 'DELETED' END as service_state
FROM "Services" 
WHERE "servicesName" IN ('Vent Cleaning', 'Pump Maintenance', 'Cooling Tower', 'Generator')
AND "deletedAt" IS NULL
ORDER BY "servicesName";

-- Show soft-deleted services
SELECT 
    'Removed Services' as category,
    "servicesName",
    "deletedAt",
    "modifiedAt"
FROM "Services" 
WHERE "servicesName" IN (
    'Air Duct Cleaning',
    'Boiler Maintenance',
    'Dryer Vent Cleaning', 
    'Staffed Services',
    'Janitorial',
    'Emergency Maintenance',
    'Concierges',
    'On-site Guard (Armed)',
    'On-site Guard (Unarmed)',
    'On-site Patrolling (Armed)',
    'On-site Patrolling (Unarmed)',
    'Off-site Surveillances'
) AND "deletedAt" IS NOT NULL
ORDER BY "servicesName";

-- Check for exact matches of our target services
SELECT 
    'Target Services Check' as category,
    "servicesName",
    category,
    status,
    "deletedAt"
FROM "Services" 
WHERE "servicesName" IN (
    'Pump Maintenance',
    'Vent Cleaning',
    'Generator', 
    'Cooling Tower',
    'Pressure Wash'
) AND "deletedAt" IS NULL
ORDER BY "servicesName";

-- List all existing active services
SELECT 
    'All Existing Services' as list_type,
    "servicesName",
    category,
    status,
    "parentServiceId",
    "createdAt"
FROM "Services" 
WHERE "deletedAt" IS NULL
ORDER BY category, "servicesName";

-- Commit the transaction
COMMIT;
