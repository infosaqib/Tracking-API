

-- Create Table User Enums
DO $$ BEGIN
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'user_statuses') THEN
        CREATE TYPE user_statuses AS ENUM ('active', 'inactive');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'tenant_types') THEN
        CREATE TYPE tenant_types AS ENUM ('client', 'vendor','vendor-branch','vendor-franchise','property-group');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'tenant_user_types') THEN
        CREATE TYPE tenant_user_types AS ENUM ('primary', 'secondary','terssuary');
    END IF;
	IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'perm_types') THEN
        CREATE TYPE perm_types AS ENUM ('client-perm', 'vendor-perm','staff-perm');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'client_types') THEN
        CREATE TYPE client_types AS ENUM ('multi-family', 'hoa','commercial','retail','hotel');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'vendor_union_types') THEN
        CREATE TYPE vendor_union_types AS ENUM ('', '');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'email_template_types') THEN
        CREATE TYPE email_template_types AS ENUM ('vendor', 'client');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'vendor_locations_types') THEN
        CREATE TYPE vendor_locations_types AS ENUM ('hq', 'branch');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'client_status') THEN
        CREATE TYPE client_status AS ENUM ('active', 'inactive');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'property_building_type') THEN
        CREATE TYPE property_building_types AS ENUM ('a', 'b', 'c');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'property_statuses') THEN
        CREATE TYPE property_statuses AS ENUM ('active', 'inactive');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'property_service_types') THEN
        CREATE TYPE property_service_types AS ENUM ('service', 'sub-service');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'vendor_stauses') THEN
        CREATE TYPE vendor_statuses AS ENUM ('active','in-active');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'service_stauses') THEN
        CREATE TYPE service_statuses AS ENUM ('main','sub');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'tenant_user_filter_types') THEN
        CREATE TYPE tenant_user_filter_types AS ENUM ('client','property','multi-property');
    END IF;
END $$;

-- Ensure search path is correctly set if using a specific schema
SET search_path TO public;


CREATE TABLE IF NOT EXISTS "tbl_tenants" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_name VARCHAR(250) NOT NULL,
    tenant_type tenant_types NOT NULL, -- client or vendor
    fk_parent_tenant_id UUID, -- Reference to the parent tenant (e.g., vendor or client)
    fk_parent_company_tenant_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fk_parent_tenant_id) REFERENCES "tbl_tenants"(id) ON DELETE RESTRICT
    FOREIGN KEY (fk_parent_company_tenant_id) REFERENCES "tbl_tenants"(id) ON DELETE RESTRICT
    created_by UUID,
    modified_by UUID
);
-- Create Table User 
CREATE TABLE IF NOT EXISTS "tbl_users" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) NOT NULL UNIQUE,
    user_is_internal BOOLEAN NOT NULL,
    user_title VARCHAR(50),
    user_is_authorised BOOLEAN NOT NULL DEFAULT FALSE,
    user_status user_statuses NOT NULL DEFAULT 'active',
    user_last_invite_id TEXT,
    user_last_invite_send_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_first_name VARCHAR(255) NOT NULL, 
    user_last_name VARCHAR(255),
    user_phone_number VARCHAR(20),
    user_avatar_url TEXT,
    user_cognito_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was created
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete status
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (fk_tenant) REFERENCES "tbl_tenants"(id) ON DELETE CASCADE
   
);

CREATE TABLE IF NOT EXISTS "tbl_user_tenants" (
  fk_user_id UUID NOT NULL,
  fk_tenant_id UUID NOT NULL,
  PRIMARY KEY (fk_user_id, fk_tenant_id),
  is_primary_tenant BOOLEAN DEFAULT FALSE,
  tenat_user_type tenant_user_types,
  tenant_user_filter_type tenant_user_filter_type DEFAULT 'client',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was created
  modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
  created_by UUID, -- User who created the record
  modified_by UUID, -- User who last modified the record
  is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete status
  FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
  FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
  FOREIGN KEY (fk_tenant) REFERENCES "tbl_tenants"(id) ON DELETE CASCADE
  FOREIGN KEY (fk_user_id) REFERENCES "tbl_users"(id) ON DELETE CASCADE, -- Optional: to enforce referential integrity

);
CREATE INDEX idx_fk_tenant_id ON tbl_user_tenants(fk_tenant_id);
CREATE INDEX idx_fk_user_id ON tbl_user_tenants(fk_user_id);

-- Create Table Role
CREATE TABLE IF NOT EXISTS "tbl_roles"(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_tenant UUID,
    role_level INT NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was created
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete status
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (fk_tenant) REFERENCES "tbl_tenants"(id) ON DELETE CASCADE

);

-- Create Table User Role
CREATE TABLE "tbl_user_role_map" (
    fk_user_id UUID NOT NULL,
    fk_role_id UUID NOT NULL,
    PRIMARY KEY (fk_user_id, fk_role_id),
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    FOREIGN KEY (fk_user_id) REFERENCES "tbl_users" (id) ON DELETE CASCADE,
    FOREIGN KEY (fk_role_id) REFERENCES "tbl_roles" (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT -- Optional: to enforce referential integrity

);
-- Create Indexes users and roles mapping
-- CREATE INDEX IF NOT EXISTS idx_user_role_user_id ON "tbl_user_role" (fk_user_id);
-- CREATE INDEX IF NOT EXISTS idx_user_role_role_id ON "tbl_user_role" (fk_role_id);

-- Create Permission table

CREATE TABLE IF NOT EXISTS "tbl_permissions" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_perm_module UUID, NOT NULL,
    perm_name VARCHAR(100) NOT NULL,
    perm_type perm_types NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    FOREIGN KEY (fk_perm_module) REFERENCES "tbl_permissions_modules"(id) ON DELETE RESTRICT


);

CREATE TABLE IF NOT EXISTS "tbl_permissions_modules" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perm_module_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
);


-- Create Role Permission Table
CREATE TABLE IF NOT EXISTS "tbl_role_permission_map"(
    fk_role_id UUID NOT NULL,
    fk_perm_id UUID NOT NULL,
    PRIMARY KEY(fk_role_id, fk_perm_id),
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    FOREIGN KEY (fk_perm_id) REFERENCES "tbl_permissions" (id) ON DELETE CASCADE,
    FOREIGN KEY (fk_role_id) REFERENCES "tbl_roles" (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT -- Optional: to enforce referential integrity


);

-- Create Indexes for roles and permissions mapping

-- CREATE INDEX IF NOT EXISTS idx_role_perm_perm_id ON "tbl_role_permission" (fk_perm_id);
-- CREATE INDEX IF NOT EXISTS idx_role_perm_role_id ON "tbl_role_permission" (fk_role_id);

-- Create Client
CREATE TABLE IF NOT EXISTS "tbl_client"(
    fk_tenant_id UUID NOT NULL,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_type client_types NOT NULL,
    client_description TEXT,
    logo_url TEXT,
    client_only_approved_vendors BOOLEAN,
    client_website TEXT,
    client_name VARCHAR(500) NOT NULL,
    client_legal_name VARCHAR(500) NOT NULL,
    client_status client_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete status
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (fk_tenant) REFERENCES "tbl_tenants"(id) ON DELETE CASCADE
    
)



CREATE TABLE IF NOT EXISTS "tbl_client_properties"(
    fk_tenant_id UUID NOT NULL,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_name VARCHAR(250) NOT NULL, 
    fk_property_manager UUID,
    property_legal_name VARCHAR(250),
    property_address TEXT,
    property_zip VARCHAR(8),
    property_unit_count INTEGER,
    property_building_count INTEGER,
    property_building_type property_building_types,
    property_floor_count INT,
    property_acres DECIMAL,
    property_lattitude TEXT,
    property_longitude TEXT,
    property_note TEXT,
    property_is_retail BOOLEAN,
    property_is_retail_scope BOOLEAN,
    property_status property_statuses NOT NULL DEFAULT 'active',
    fk_property_county UUID,
    fk_property_state UUID,
    fk_property_county UUID,
    fk_property_city UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete status
    FOREIGN KEY (fk_property_manager) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, 
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT -- Optional: to enforce referential integrity
    FOREIGN KEY (fk_property_country) REFERENCES "tbl_countries"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (fk_property_state) REFERENCES "tbl_states"(id) ON DELETE RESTRICT -- Optional: to enforce referential integrity
    FOREIGN KEY (fk_property_county) REFERENCES "tbl_county"(id) ON DELETE RESTRICT -- Optional: t
    FOREIGN KEY (fk_property_city) REFERENCES "tbl_city"(id) ON DELETE RESTRICT -- Option
    FOREIGN KEY (fk_tenant) REFERENCES "tbl_tenants"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "tbl_mapped_property_services"(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_service UUID NOT NULL,
    fk_subservice UUID,
    fk_property UUID, NOT NULL
    service_status service_statuses,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrit
    FOREIGN KEY (fk_service) REFERENCES "tbl_services"(id) ON DELETE RESTRICT, 
    FOREIGN KEY (fk_sub_service) REFERENCES "tbl_sub_services"(id) ON DELETE RESTRICT, 
    FOREIGN KEY (fk_property) REFERENCES "tbl_client_properties"(id) ON DELETE RESTRICT, 

);


CREATE TABLE IF NOT EXISTS "tbl_property_contacts"(
    fk_contact UUID,
    fk_property UUID,
    PRIMARY KEY (fk_contact_id, fk_property_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT -- Optional: to enforce referential integrity
    FOREIGN KEY (fk_property) REFERENCES "tbl_client_properties"(id) ON DELETE RESTRICT, 
    FOREIGN KEY (fk_contact) REFERENCES "tbl_users"(id) ON DELETE RESTRICT
)

-- Create table for countries with MultiPolygon geometry
CREATE TABLE IF NOT EXISTS "tbl_countries" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_name VARCHAR(250) NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326),  -- Changed to MultiPolygon
);

-- Create table for states with MultiPolygon geometry
CREATE TABLE IF NOT EXISTS "tbl_states" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_country UUID NOT NULL,
    state_name VARCHAR(250) NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326),  -- Changed to MultiPolygon
    FOREIGN KEY (fk_country) REFERENCES "tbl_countries"(id) ON DELETE CASCADE
);

-- Create table for counties with MultiPolygon geometry
CREATE TABLE IF NOT EXISTS "tbl_counties" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_state UUID NOT NULL,
    county_name VARCHAR(250) NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326),  -- Changed to MultiPolygon
    FOREIGN KEY (fk_state) REFERENCES "tbl_states"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "tbl_cities" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_state UUID NOT NULL,
    city_name VARCHAR(250) NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326),  -- Using MultiPolygon for city geometries
    FOREIGN KEY (fk_state) REFERENCES "tbl_states"(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS "tbl_vendors"(
    fk_tenant_id UUID NOT NULL,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name VARCHAR(255) NOT NULL,
    vendor_logo TEXT,
    vendor_source TEXT, 
    vendor_legal_name VARCHAR(255),
    vendor_status vendor_statuses NOT NULL DEFAULT 'active',
    vendor_w9_url TEXT,
    vendor_ownersip TEXT,
    vendor_expereince INTEGER,
    vendor_social_security_number TEXT,
    vendor_service_cover_continetal_us BOOLEAN,
    vendor_intrested_recieve_rfp_outside BOOLEAN,
    vendor_address TEXT,
    fk_vendor_city UUID,
    fk_vendor_state UUID,
    fk_vendor_county UUID,
    vendor_zip VARCHAR(8),
    vendor_union vendor_union_types,
    fk_accountant_id UUID,
    vendor_recognition TEXT,
    vendor_ein TEXT,
    vendor_website TEXT,
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    FOREIGN KEY (fk_accountant_id) REFERENCES "tbl_users"(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (fk_tenant) REFERENCES "tbl_tenants"(id) ON DELETE CASCADE
    FOREIGN KEY (fk_vendor_city) REFERENCES "tbl_cities"(id) ON DELETE RESTRICT,
    FOREIGN KEY (fk_vendor_state) REFERENCES "tbl_states"(id) ON DELETE RESTRICT,
    FOREIGN KEY (fk_vendor_county) REFERENCES "tbl_counties"(id) ON DELETE RESTRICT


);

CREATE TABLE IF NOT EXISTS "tbl_vendor_services"(
    fk_vendor_id UUID NOT NULL,
    fk_service_id UUID NOT NULL,
    PRIMARY KEY(fk_vendor_id, fk_service_id),
    vendor_service_type vendor_service_types NOT NULL DEFAULT 'main',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID, -- User who created the record
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT,
    FOREIGN KEY (fk_vendor) REFERENCES "tbl_vendors"(id) ON DELETE RESTRICT, 
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT,
)



CREATE TABLE IF NOT EXISTS "tbl_vendor_insurances"(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_vendor UUID NOT NULL,
    vendor_insurance_file_url TEXT NOT NULL,
    vendor_policy_exp_date DATE,
    vendor_document_status vendor_document_statuses  DEFAULT 'primary',
    vendor_insurance_note TEXT,
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    tenant_id UUID NOT NULL,
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (fk_vendor) REFERENCES "tbl_vendors"(id) ON DELETE RESTRICT, 
);


CREATE TABLE IF NOT EXISTS "tbl_vendor_notes"(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_vendor UUID NOT NULL,
    vendor_note TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    tenant_id UUID NOT NULL,
    FOREIGN KEY (fk_vendor) REFERENCES "tbl_vendors"(id) ON DELETE RESTRICT
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity

);

CREATE TABLE IF NOT EXISTS "tbl_services"(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    services_name TEXT NOT NULL,
    service_description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete status
    fk_service_approved_by UUID,
    service_approved_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrit
    FOREIGN KEY (service_approved_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT,
);

CREATE TABLE IF NOT EXISTS "tbl_sub_services"(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_service UUID NOT NULL,
    sub_services_name TEXT NOT NULL,
    sub_service_description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date when the user record was last modified
    created_by UUID, -- User who created the record
    modified_by UUID, -- User who last modified the record
    FOREIGN KEY (created_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrity
    FOREIGN KEY (modified_by) REFERENCES "tbl_users"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrit
    FOREIGN KEY (fk_service) REFERENCES "tbl_services"(id) ON DELETE RESTRICT, -- Optional: to enforce referential integrit


);


CREATE TABLE IF NOT EXISTS "tbl_email_templates"(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_template_name VARCHAR(255) NOT NULL,
    email_template_subject VARCHAR(255) NOT NULL,
    email_template_body TEXT NOT NULL,
    email_template_type email_template_types NOT NULL,
)

CREATE TABLE IF NOT EXISTS "tbl_email_send_log"(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_template_name VARCHAR(255) NOT NULL,
    email_template_subject VARCHAR(255) NOT NULL,
    email_template_body TEXT NOT NULL,
    email_template_type email_template_types NOT NULL,
)


-- Indexed to retun roles with permission faster
CREATE INDEX idx_role_permissions_active ON "tbl_role_permission_map"(fk_role_id, is_deleted);