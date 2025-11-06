-- Production Services Management Script with Duplication Handling
-- This script adds 52 new production services all with OPEX category

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
    services_to_add TEXT[] := ARRAY[
        'Maintenance contract',
        'Modernization',
        'Fire panel monitoring',
        'Fire alarm monitoring',
        'Fitness PM',
        'Fitness Attendants',
        'Fitness Classes',
        'Fitness Equipment',
        'LL 55',
        'Garage Door PMs',
        'Pressure Washing',
        'Window Washing',
        'Gutter Cleaning',
        'Stormwater',
        'Chute cleaning',
        'Carpentry',
        'Vent Cleaning',
        'Pump Maintenance',
        'Maintenance',
        'Purchasing',
        'RTUs',
        'PTACs',
        'Water Treatment',
        'Domestic Hot water',
        'Cooling Tower',
        'Boiler and Chiller',
        'Snow',
        'Elevator',
        'Emergency Generators',
        'Trash Compactor',
        'Generator',
        'Digital Marketing',
        'Concrete',
        'Line striping',
        'Termite bonds',
        'Pool Attendants',
        'Pool Maintenance',
        'Pool Management',
        'Septic',
        'Line jetting',
        'Appliance suppliers',
        'Doorstep trash',
        'Trash Hauling',
        'Composting',
        'Bulk Trash',
        'Unit Paint',
        'Unit Clean',
        'Unit countertop/Tub Reglazing',
        'Tub Refurnishing',
        'Countertop Installation',
        'Countertop Refurnishing',
        'Unit Carpet Cleaning'
    ];
    service_name TEXT;
    created_count INTEGER := 0;
    skipped_count INTEGER := 0;
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
    RAISE NOTICE 'Starting to process % services', array_length(services_to_add, 1);

    -- Process each service in the array
    FOREACH service_name IN ARRAY services_to_add
    LOOP
        -- Check if service already exists
        IF NOT EXISTS (SELECT 1 FROM "Services" WHERE "servicesName" = service_name AND "deletedAt" IS NULL) THEN
            -- Create new service
            INSERT INTO "Services" (
                id, "servicesName", category, status, "createdAt", "modifiedAt", 
                "creatorId", "updaterId", "serviceApprovedById", "serviceApprovedOn"
            ) VALUES (
                gen_random_uuid(), service_name, 'OPEX', 'ACTIVE', NOW(), NOW(),
                super_admin_id, super_admin_id, super_admin_id, NOW()
            );
            
            INSERT INTO service_operations VALUES ('CREATE', service_name, 'Created new service (OPEX)', NULL);
            created_count := created_count + 1;
            RAISE NOTICE 'Created service: %', service_name;
        ELSE
            INSERT INTO service_operations VALUES ('SKIP', service_name, 'Service already exists', NULL);
            skipped_count := skipped_count + 1;
            RAISE NOTICE 'Skipped service (already exists): %', service_name;
        END IF;
    END LOOP;

    RAISE NOTICE 'Production services processing completed!';
    RAISE NOTICE 'Services created: %', created_count;
    RAISE NOTICE 'Services skipped (already existed): %', skipped_count;
    RAISE NOTICE 'Super admin ID used: %', super_admin_id;
    
END $$;

-- Show operation summary
SELECT 
    operation_type,
    COUNT(*) as count,
    STRING_AGG(service_name, ', ' ORDER BY service_name) as services
FROM service_operations 
GROUP BY operation_type
ORDER BY operation_type;

-- Show detailed operations
SELECT 
    operation_type,
    service_name,
    action_taken
FROM service_operations 
ORDER BY 
    CASE operation_type 
        WHEN 'CREATE' THEN 1 
        WHEN 'SKIP' THEN 2 
        ELSE 3 
    END,
    service_name;

-- Verify all newly created services
SELECT 
    'Newly Created Services' as category,
    "servicesName",
    category,
    status,
    "createdAt",
    "modifiedAt"
FROM "Services" 
WHERE "servicesName" IN (
    'Maintenance contract',
    'Modernization',
    'Fire panel monitoring',
    'Fire alarm monitoring',
    'Fitness PM',
    'Fitness Attendants',
    'Fitness Classes',
    'Fitness Equipment',
    'LL 55',
    'Garage Door PMs',
    'Pressure Washing',
    'Window Washing',
    'Gutter Cleaning',
    'Stormwater',
    'Chute cleaning',
    'Carpentry',
    'Vent Cleaning',
    'Pump Maintenance',
    'Maintenance',
    'Purchasing',
    'RTUs',
    'PTACs',
    'Water Treatment',
    'Domestic Hot water',
    'Cooling Tower',
    'Boiler and Chiller',
    'Snow',
    'Elevator',
    'Emergency Generators',
    'Trash Compactor',
    'Generator',
    'Digital Marketing',
    'Concrete',
    'Line striping',
    'Termite bonds',
    'Pool Attendants',
    'Pool Maintenance',
    'Pool Management',
    'Septic',
    'Line jetting',
    'Appliance suppliers',
    'Doorstep trash',
    'Trash Hauling',
    'Composting',
    'Bulk Trash',
    'Unit Paint',
    'Unit Clean',
    'Unit countertop/Tub Reglazing',
    'Tub Refurnishing',
    'Countertop Installation',
    'Countertop Refurnishing',
    'Unit Carpet Cleaning'
)
AND "deletedAt" IS NULL
ORDER BY "servicesName";

-- Verify OPEX category assignment
SELECT 
    'OPEX Services Verification' as verification_type,
    COUNT(*) as total_opex_services,
    COUNT(CASE WHEN "servicesName" IN (
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
    ) THEN 1 END) as production_services_count
FROM "Services" 
WHERE category = 'OPEX' AND "deletedAt" IS NULL;

-- Show services by category for verification
SELECT 
    category,
    COUNT(*) as service_count,
    ARRAY_AGG("servicesName" ORDER BY "servicesName") as services
FROM "Services" 
WHERE "deletedAt" IS NULL
GROUP BY category
ORDER BY category;

-- Final verification - show all target services with their current status
SELECT 
    'Final Verification' as check_type,
    "servicesName",
    category,
    status,
    CASE WHEN "deletedAt" IS NULL THEN 'ACTIVE' ELSE 'DELETED' END as service_state,
    "createdAt"
FROM "Services" 
WHERE "servicesName" IN (
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
)
ORDER BY "servicesName";

-- Commit the transaction
COMMIT;
