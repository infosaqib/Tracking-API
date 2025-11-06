-- Update all user tenants with contact type of PRIMARY_CONTACT or SECONDARY_CONTACT to have a tenantUserFilterType of CLIENT

UPDATE "UserTenants"
SET "tenantUserFilterType" = 'CLIENT'
WHERE "contactType" IN ('PRIMARY_CONTACT', 'SECONDARY_CONTACT')
AND "tenantUserFilterType" = 'PROPERTY';