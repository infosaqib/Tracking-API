-- Production Services Management Script
-- This script ensures that all 52 required production services exist with their exact names.
-- It is idempotent and safe to run multiple times.

-- Use transaction for atomicity
BEGIN;

-- Create a temporary table to track our operations
CREATE TEMP TABLE service_operations (
    operation_type TEXT,
    service_name TEXT,
    action_taken TEXT
);

DO $$
DECLARE
    super_admin_id TEXT;
    services_to_ensure TEXT[] := ARRAY[
        'Maintenance contract', 'Modernization', 'Fire panel monitoring', 'Fire alarm monitoring',
        'Fitness PM', 'Fitness Attendants', 'Fitness Classes', 'Fitness Equipment',
        'LL 55', 'Garage Door PMs', 'Pressure Washing', 'Window Washing',
        'Gutter Cleaning', 'Stormwater', 'Chute cleaning', 'Carpentry',
        'Vent Cleaning', 'Pump Maintenance', 'Maintenance', 'Purchasing',
        'RTUs', 'PTACs', 'Water Treatment', 'Domestic Hot water',
        'Cooling Tower', 'Boiler and Chiller', 'Snow', 'Elevator',
        'Emergency Generators', 'Trash Compactor', 'Generator', 'Digital Marketing',
        'Concrete', 'Line striping', 'Termite bonds', 'Pool Attendants',
        'Pool Maintenance', 'Pool Management', 'Septic', 'Line jetting',
        'Appliance suppliers', 'Doorstep trash', 'Trash Hauling', 'Composting',
        'Bulk Trash', 'Unit Paint', 'Unit Clean', 'Unit countertop/Tub Reglazing',
        'Tub Refurnishing', 'Countertop Installation', 'Countertop Refurnishing',
        'Unit Carpet Cleaning'
    ];
    service_name TEXT;
    created_count INTEGER := 0;
    skipped_count INTEGER := 0;
BEGIN
    -- Get a super admin user ID for audit purposes
    SELECT u.id INTO super_admin_id
    FROM "Users" u
    JOIN "UserRoles" ur ON u.id = ur."userId"
    JOIN "Roles" r ON ur."roleId" = r.id
    WHERE r."roleLevel" = 1
    LIMIT 1;

    -- If no super admin found, use the first user as a fallback
    IF super_admin_id IS NULL THEN
        SELECT id INTO super_admin_id FROM "Users" LIMIT 1;
    END IF;

    RAISE NOTICE 'Using super admin ID: %', super_admin_id;
    RAISE NOTICE 'Verifying and creating % services as needed...', array_length(services_to_ensure, 1);

    -- Loop through the list of required services
    FOREACH service_name IN ARRAY services_to_ensure
    LOOP
        -- Check if a service with the exact name already exists and is not deleted
        IF NOT EXISTS (SELECT 1 FROM "Services" WHERE "servicesName" = service_name AND "deletedAt" IS NULL) THEN
            -- If it does not exist, create it.
            -- The new service is automatically approved by the super admin upon creation.
            -- 'serviceApprovedById' is set to super_admin_id and 'serviceApprovedOn' is set to the current timestamp.
            INSERT INTO "Services" (
                id, "servicesName", category, status, "createdAt", "modifiedAt", 
                "creatorId", "updaterId", "serviceApprovedById", "serviceApprovedOn"
            ) VALUES (
                gen_random_uuid(), service_name, 'OPEX', 'ACTIVE', NOW(), NOW(),
                super_admin_id, super_admin_id, super_admin_id, NOW()
            );
            
            INSERT INTO service_operations VALUES ('CREATE', service_name, 'Created new service with category OPEX');
            created_count := created_count + 1;
        ELSE
            -- If it already exists, do nothing and log it as skipped
            INSERT INTO service_operations VALUES ('SKIP', service_name, 'Service with this exact name already exists');
            skipped_count := skipped_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'Service verification and creation process complete.';
    RAISE NOTICE 'Services created: %', created_count;
    RAISE NOTICE 'Services skipped (already existed): %', skipped_count;
    RAISE NOTICE '--------------------------------------------------';
    
END $$;

-- Final Report: Show a summary of all operations performed
SELECT 
    operation_type,
    COUNT(*) as count,
    STRING_AGG(service_name, ', ' ORDER BY service_name) as services_processed
FROM service_operations 
GROUP BY operation_type
ORDER BY operation_type;

-- Verification Query: List all 52 services to confirm they exist
SELECT 
    "servicesName",
    category,
    status,
    "createdAt"
FROM "Services" 
WHERE "servicesName" = ANY(ARRAY[
    'Maintenance contract', 'Modernization', 'Fire panel monitoring', 'Fire alarm monitoring',
    'Fitness PM', 'Fitness Attendants', 'Fitness Classes', 'Fitness Equipment',
    'LL 55', 'Garage Door PMs', 'Pressure Washing', 'Window Washing',
    'Gutter Cleaning', 'Stormwater', 'Chute cleaning', 'Carpentry',
    'Vent Cleaning', 'Pump Maintenance', 'Maintenance', 'Purchasing',
    'RTUs', 'PTACs', 'Water Treatment', 'Domestic Hot water',
    'Cooling Tower', 'Boiler and Chiller', 'Snow', 'Elevator',
    'Emergency Generators', 'Trash Compactor', 'Generator', 'Digital Marketing',
    'Concrete', 'Line striping', 'Termite bonds', 'Pool Attendants',
    'Pool Maintenance', 'Pool Management', 'Septic', 'Line jetting',
    'Appliance suppliers', 'Doorstep trash', 'Trash Hauling', 'Composting',
    'Bulk Trash', 'Unit Paint', 'Unit Clean', 'Unit countertop/Tub Reglazing',
    'Tub Refurnishing', 'Countertop Installation', 'Countertop Refurnishing',
    'Unit Carpet Cleaning'
])
AND "deletedAt" IS NULL
ORDER BY "servicesName";

-- Commit the transaction to save the changes
COMMIT; 